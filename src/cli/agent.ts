import { exa } from '@/inngest/functions/execute-searches';
import { nanoid, processFootnotes } from '@/utils';
import { type SearchQueryList, type SearchResult, b } from '@baml-client';
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
					numResults: 10,
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
			const answer = await b.CreateAnswer(
				new Date().toLocaleDateString(),
				researchTopic,
				state.searchResults,
			);
			state.answer = processFootnotes(answer, state.searchResults);
			eventEmitter.emit('state-update', {
				type: 'answer',
				data: state.answer,
			} satisfies AnswerStep);
			return state.answer;
		}

		const reflection = await b.Reflect(
			state.searchResults,
			researchTopic,
			new Date().toLocaleDateString(),
		);

		eventEmitter.emit('state-update', {
			type: 'reflection-complete',
			data: reflection,
		} satisfies ReflectionStep);

		if (reflection.isSufficient) {
			const answer = await b.CreateAnswer(
				new Date().toLocaleDateString(),
				researchTopic,
				state.searchResults,
			);
			state.answer = processFootnotes(answer, state.searchResults);
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
			} satisfies SearchQueryList,
		} satisfies QueriesGeneratedStep);
	}
}
