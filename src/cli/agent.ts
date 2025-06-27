import { exa } from '@/inngest/functions/execute-searches';
import { nanoid, processFootnotes, sanitizeForFilename } from '@/utils';
import {
	type AttemptedKnowledgeGap,
	type ExtractedFact,
	type KnowledgeGapHistory,
	type SearchQueryList,
	type SearchResult,
	b,
} from '@baml-client';
import { EventEmitter } from 'node:events';
import { writeFileSync } from 'node:fs';
import type {
	AgentState,
	AnswerStep,
	FollowUpQueryGenerationStep,
	InputStep,
	KnowledgeGapAnalysisStep,
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
		knowledgeGapHistory: { gaps: [], currentGapIndex: -1 },
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

	// Track which questions from the query plan have been answered (external tracking)
	const answeredQuestions = new Set<number>();
	const getUnansweredQuestions = () =>
		initialQueries.queryPlan
			.map((_, index) => index)
			.filter((i) => !answeredQuestions.has(i));

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
			saveReport(researchTopic, state.answer);
			return state.answer;
		}

		const reflection = await b.Reflect(
			searchResults, // Only current batch for analysis
			researchTopic,
			new Date().toLocaleDateString(),
			initialQueries.queryPlan,
			Array.from(answeredQuestions),
			getUnansweredQuestions(),
			state.knowledgeGapHistory.currentGapIndex != null &&
				state.knowledgeGapHistory.currentGapIndex >= 0
				? (state.knowledgeGapHistory.gaps[
						state.knowledgeGapHistory.currentGapIndex
					]?.description ?? null)
				: null,
			currentRound,
			originalMaxRounds,
		);

		// Debug logging for question tracking
		console.log(`Round ${currentRound} Question Tracking:`);
		console.log(
			`  Before reflection - Answered: [${Array.from(answeredQuestions).join(', ')}]`,
		);
		console.log(
			`  Before reflection - Unanswered: [${getUnansweredQuestions().join(', ')}]`,
		);
		console.log(
			`  New answers this round: [${reflection.answeredQuestions.join(', ')}]`,
		);

		// Add newly answered questions to our external tracking (additive only)
		for (const questionIndex of reflection.answeredQuestions) {
			answeredQuestions.add(questionIndex);
		}

		console.log(
			`  Final answered questions: [${Array.from(answeredQuestions).join(', ')}]`,
		);
		console.log(
			`  Final unanswered questions: [${getUnansweredQuestions().join(', ')}]`,
		);

		eventEmitter.emit('state-update', {
			type: 'reflection-complete',
			data: {
				...reflection,
				// Use external tracking for answered/unanswered questions
				answeredQuestions: Array.from(answeredQuestions),
				unansweredQuestions: getUnansweredQuestions(),
				relevantSummariesCount: extractedFacts.length,
			},
		} satisfies ReflectionStep);

		// Run concurrent knowledge gap analysis and fact extraction
		const [gapAnalysis, newExtractedFacts] = await Promise.all([
			// Knowledge gap analysis (if research is not sufficient)
			reflection.isSufficient
				? null
				: b.AnalyzeKnowledgeGaps(
						state.knowledgeGapHistory,
						reflection,
						initialQueries.queryPlan,
						currentRound,
					),
			// Fact extraction (if relevant sources identified)
			reflection.relevantSummaryIds.length > 0
				? (async () => {
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
						const extractedFactsResult = await b.ExtractRelevantFacts(
							relevantSources,
							researchTopic,
							initialQueries.queryPlan,
							reflection,
							new Date().toLocaleDateString(),
						);

						console.log(`Extracted ${extractedFactsResult.length} fact sets.`);

						// Emit fact extraction complete event
						eventEmitter.emit('state-replace', {
							type: 'summarization',
							isExtracting: false,
							extractedFacts: extractedFactsResult,
						} satisfies SummarizationStep);

						return extractedFactsResult;
					})()
				: null,
		]);

		// Add newly extracted facts to the collection
		if (newExtractedFacts) {
			extractedFacts.push(...newExtractedFacts);
		}

		// Emit knowledge gap analysis results
		if (gapAnalysis) {
			// Update knowledge gap history based on analysis
			state.knowledgeGapHistory.gaps = gapAnalysis.updatedGapHistory;

			eventEmitter.emit('state-update', {
				type: 'knowledge-gap-analysis',
				data: gapAnalysis,
			} satisfies KnowledgeGapAnalysisStep);
		}

		// Check if research is sufficient or we should continue
		if (reflection.isSufficient || !gapAnalysis?.shouldContinueResearch) {
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
			saveReport(researchTopic, state.answer);
			return state.answer;
		}

		// Generate follow-up queries based on knowledge gap analysis
		const followUpQueries = await b.GenerateFollowUpQueries(
			gapAnalysis.nextGapToResearch ??
				'Continue research based on unanswered questions',
			getCurrentGapPreviousQueries(
				state.knowledgeGapHistory,
				gapAnalysis.nextGapToResearch ?? null,
			),
			reflection,
			initialQueries.queryPlan,
			currentRound,
			getUnansweredQuestions(),
		);

		// Update current gap index if switching to a new gap
		if (
			gapAnalysis.gapStatus === 'new' ||
			gapAnalysis.gapStatus === 'switching'
		) {
			const gapIndex = state.knowledgeGapHistory.gaps.findIndex(
				(gap) => gap.description === gapAnalysis.nextGapToResearch,
			);
			state.knowledgeGapHistory.currentGapIndex = gapIndex;
		}

		eventEmitter.emit('state-update', {
			type: 'followup-query-generation',
			data: followUpQueries,
		} satisfies FollowUpQueryGenerationStep);

		queries = followUpQueries.queries;

		// Increment round counter for next iteration
		currentRound += 1;
	}
}

// Helper function to get previous queries for current knowledge gap
function getCurrentGapPreviousQueries(
	gapHistory: KnowledgeGapHistory,
	targetGap: string | null,
): string[] {
	if (!targetGap) return [];

	const gap = gapHistory.gaps.find(
		(g: AttemptedKnowledgeGap) => g.description === targetGap,
	);
	return gap?.previousQueries || [];
}

// Helper function to save the research report to a file
function saveReport(researchTopic: string, answer: string): void {
	try {
		const sanitizedTopic = sanitizeForFilename(researchTopic);
		const filename = `report-${sanitizedTopic}.md`;
		writeFileSync(filename, answer, 'utf8');
		console.log(`Research report saved to: ${filename}`);
	} catch (error) {
		console.error('Failed to save research report:', error);
	}
}
