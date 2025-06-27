import { exa } from '@/inngest/functions/execute-searches';
import { nanoid, processFootnotes } from '@/utils';
import {
	type ExtractedFact,
	type SearchQueryList,
	type SearchResult,
	b,
} from '@baml-client';
import { EventEmitter } from 'node:events';
import type {
	AgentState,
	AnswerStep,
	InputStep,
	MaxStepsReachedStep,
	QueriesGeneratedStep,
	ReflectionStep,
	SearchResultsStep,
	SearchingStep,
	SummarizationStep,
} from './types';

export const eventEmitter = new EventEmitter();

export async function executeAgent({
	researchTopic,
	maxRounds,
}: { researchTopic: string; maxRounds?: number }) {
	eventEmitter.emit('state-update', {
		type: 'input',
		data: researchTopic,
	} satisfies InputStep);

	const rounds = maxRounds ?? 10;
	const originalMaxRounds = rounds; // Keep track of original max rounds
	let currentRound = 1; // Track current round number

	const state: AgentState = {
		researchTopic,
		searchResults: [],
		steps: [],
		state: 'start',
		roundsLeft: rounds,
		answer: null,
	};

	console.log(`Now there are ${state.steps.length} steps`);

	const initialQueries: SearchQueryList = await b.GenerateQuery({
		research_topic: researchTopic,
		current_date: new Date().toLocaleDateString(),
	});

	eventEmitter.emit('state-update', {
		type: 'queries-generated',
		data: initialQueries,
	} satisfies QueriesGeneratedStep);

	// Track extracted facts (those that contain concise, relevant information)
	const extractedFacts: Array<ExtractedFact> = [];

	// Track which questions from the query plan have been answered
	let answeredQuestions: Array<number> = [];
	let unansweredQuestions: Array<number> = initialQueries.queryPlan.map(
		(_, index) => index,
	);

	let queries: Array<string> = initialQueries.query;
	while (state.roundsLeft > 0) {
		const queryStatuses: Record<string, 'pending' | 'completed'> = {};
		for (const query of queries) {
			queryStatuses[query] = 'pending';
		}
		eventEmitter.emit('state-update', {
			type: 'searching',
			data: queryStatuses,
		} satisfies SearchingStep);

		const searchSteps: Array<Promise<SearchResult[]>> = [];
		for (const query of queries) {
			const searchResultPromise: Promise<SearchResult[]> = exa
				.searchAndContents(query, {
					text: true,
					highlights: true,
					numResults: 4,
				})
				.then((result) => {
					queryStatuses[query] = 'completed';
					eventEmitter.emit('state-replace', {
						type: 'searching',
						data: queryStatuses,
					} satisfies SearchingStep);
					return result.results;
				});

			searchSteps.push(searchResultPromise);
		}
		const searchResults: Array<SearchResult> = (
			await Promise.all(searchSteps)
		).flat();
		for (const searchResult of searchResults) {
			searchResult.id = nanoid(4);
			state.searchResults.push(searchResult);
		}
		eventEmitter.emit('state-update', {
			type: 'search-results',
			data: {
				searchResults: searchResults,
				allSearchResults: state.searchResults,
			},
		} satisfies SearchResultsStep);

		state.roundsLeft -= 1;

		if (state.roundsLeft === 0) {
			eventEmitter.emit('state-update', {
				type: 'max-steps-reached',
			} satisfies MaxStepsReachedStep);

			let answer: string;
			if (extractedFacts.length > 0) {
				answer = await b.CreateAnswerFromFacts(
					new Date().toLocaleDateString(),
					researchTopic,
					extractedFacts,
				);
				// Create sources map from all search results for citation lookup
				const sourcesMap = new Map(
					state.searchResults.map((result) => [
						result.id || '',
						{ url: result.url || '', title: result.title || null },
					]),
				);
				state.answer = processFootnotes(answer, extractedFacts, sourcesMap);
			} else {
				answer = await b.CreateAnswer(
					new Date().toLocaleDateString(),
					researchTopic,
					state.searchResults,
				);
				state.answer = processFootnotes(answer, state.searchResults);
			}

			eventEmitter.emit('state-update', {
				type: 'answer',
				data: state.answer,
			} satisfies AnswerStep);
			return state.answer;
		}

		const reflection = await b.Reflect(
			searchResults, // Only current batch for analysis
			researchTopic,
			new Date().toLocaleDateString(),
			initialQueries.queryPlan,
			answeredQuestions,
			unansweredQuestions,
			currentRound,
			originalMaxRounds,
		);

		// Update question tracking based on reflection results
		answeredQuestions = reflection.answeredQuestions;
		unansweredQuestions = reflection.unansweredQuestions;

		eventEmitter.emit('state-update', {
			type: 'reflection-complete',
			data: {
				...reflection,
				relevantSummariesCount: extractedFacts.length,
			},
		} satisfies ReflectionStep);

		// Extract facts from relevant sources if any were identified
		if (reflection.relevantSummaryIds.length > 0) {
			const relevantSources = searchResults.filter((summary) =>
				reflection.relevantSummaryIds.includes(summary.id),
			);

			console.log(
				`Extracting facts from ${relevantSources.length} relevant sources...`,
			);

			// Emit fact extraction start event
			eventEmitter.emit('state-update', {
				type: 'summarization',
				isExtracting: true,
				relevantSourcesCount: relevantSources.length,
			} satisfies SummarizationStep);

			// Extract facts from relevant sources
			const newExtractedFacts = await b.ExtractRelevantFacts(
				relevantSources,
				researchTopic,
				initialQueries.queryPlan,
				reflection,
				new Date().toLocaleDateString(),
			);

			extractedFacts.push(...newExtractedFacts);

			console.log(
				`Extracted ${newExtractedFacts.length} fact sets. Total extracted facts: ${extractedFacts.length}`,
			);

			// Emit fact extraction complete event
			eventEmitter.emit('state-replace', {
				type: 'summarization',
				isExtracting: false,
				extractedFacts: newExtractedFacts,
			} satisfies SummarizationStep);
		}

		if (reflection.isSufficient) {
			let answer: string;
			if (extractedFacts.length > 0) {
				answer = await b.CreateAnswerFromFacts(
					new Date().toLocaleDateString(),
					researchTopic,
					extractedFacts,
				);
				// Create sources map from all search results for citation lookup
				const sourcesMap = new Map(
					state.searchResults.map((result) => [
						result.id || '',
						{ url: result.url || '', title: result.title || null },
					]),
				);
				state.answer = processFootnotes(answer, extractedFacts, sourcesMap);
			} else {
				answer = await b.CreateAnswer(
					new Date().toLocaleDateString(),
					researchTopic,
					state.searchResults,
				);
				state.answer = processFootnotes(answer, state.searchResults);
			}

			eventEmitter.emit('state-update', {
				type: 'answer',
				data: state.answer,
			} satisfies AnswerStep);
			return state.answer;
		}

		if (!reflection.followUpQueries)
			throw new Error('Follow-up queries are not specified but should be!');
		queries = reflection.followUpQueries;

		// Emit follow-up queries for UI display
		eventEmitter.emit('state-update', {
			type: 'queries-generated',
			data: {
				query: reflection.followUpQueries,
				rationale:
					reflection.knowledgeGap ||
					'Additional information needed to complete the research',
				queryPlan: initialQueries.queryPlan,
			} satisfies SearchQueryList,
		} satisfies QueriesGeneratedStep);

		// Increment round counter for next iteration
		currentRound += 1;
	}
}
