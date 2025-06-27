import type {
	AttemptedKnowledgeGap,
	ExtractedFact,
	FollowUpQueryGeneration,
	GenerateQueryArgs,
	KnowledgeGapAnalysis,
	KnowledgeGapHistory,
	Reflection,
	SearchQueryList,
	SearchResult,
} from '@baml-client';
import { b } from '@baml-client';
import { channel, topic } from '@inngest/realtime';
import { NonRetriableError } from 'inngest';
import { nanoid, processFootnotes } from '../../utils';
import { inngest } from '../client';
import { executeSearches } from './execute-searches';

export const resultsChannel = channel((uuid: string) => `deep-research.${uuid}`)
	.addTopic(topic('initialQueries').type<SearchQueryList>())
	.addTopic(topic('webSearchResults').type<SearchResult[]>())
	.addTopic(topic('reflection').type<Reflection>())
	.addTopic(topic('knowledgeGapAnalysis').type<KnowledgeGapAnalysis>())
	.addTopic(topic('followUpQueryGeneration').type<FollowUpQueryGeneration>())
	.addTopic(topic('summarization').type<ExtractedFact[]>())
	.addTopic(topic('finalAnswer').type<string>());

export type DeepResearchInvocation = GenerateQueryArgs & {
	uuid: string;
	maxRounds?: number;
};

export const deepResearch = inngest.createFunction(
	{
		id: 'deep-research',
		concurrency: {
			limit: 20,
		},
	},
	{ event: 'research/deep-research.requested' },
	async ({ event, step, logger, publish }) => {
		if (!isDeepResearchQuery(event.data)) {
			throw new NonRetriableError('Invalid deep research query:', event.data);
		}

		// Idempotent so this can be done every time.
		let maxRounds = event.data.maxRounds ?? 10;
		const { uuid, ...args } = event.data;

		logger.info('Deep research requested', args);

		// Generate the initial queries from the research
		const initialQueryInformation = await step.run(
			'generate-initial-queries',
			async () => await b.GenerateQuery(args),
		);

		// Publish it to the channel
		logger.info('Initial query information', initialQueryInformation);
		await publish(resultsChannel(uuid).initialQueries(initialQueryInformation));

		const allSearchResults: Array<SearchResult> = [];

		// Track extracted facts (those that contain concise, relevant information)
		const extractedFacts: Array<ExtractedFact> = [];

		// Track which questions from the query plan have been answered (external tracking)
		const answeredQuestions = new Set<number>();
		const getUnansweredQuestions = () =>
			initialQueryInformation.queryPlan
				.map((_, index) => index)
				.filter((i) => !answeredQuestions.has(i));

		// Track knowledge gap history for smart abandonment
		const knowledgeGapHistory: KnowledgeGapHistory = {
			gaps: [],
			currentGapIndex: -1,
		};

		logger.info(`Executing ${initialQueryInformation.query.length} queries`);
		let queries: Array<string> = initialQueryInformation.query;
		const originalMaxRounds = maxRounds; // Keep track of original max rounds
		let currentRound = 1; // Track current round number

		while (maxRounds > 0) {
			// Execute the web searches

			const searchSteps: Array<Promise<SearchResult[]>> = [];
			for (const query of queries) {
				const searchResultsPromise = step.invoke('execute-exa-searches', {
					function: executeSearches,
					data: {
						query,
					},
				});
				searchSteps.push(searchResultsPromise);
			}
			const searchResults = (await Promise.all(searchSteps)).flat();
			logger.info(`Got ${searchResults.length} search results`);

			// Save for later with IDs
			for (const result of searchResults) {
				result.id = nanoid(4);
				logger.info(
					`Search result ${result.id}: ${result.title} (${result.url})`,
				);
				logger.info(`  Text length: ${result.text?.length || 0} chars`);
				logger.info(
					`  Highlights: ${result.highlights?.length || 0} highlights`,
				);
				allSearchResults.push(result);
			}

			// Debug: Check if we have meaningful search results
			const meaningfulResults = searchResults.filter(
				(r) => r.text && r.text.length > 100,
			);
			logger.info(
				`Got ${meaningfulResults.length} meaningful search results (with >100 chars text)`,
			);

			if (searchResults.length === 0) {
				logger.warn('No search results returned from searches!');
			}

			// Publish the results
			logger.info(`Publishing ${searchResults.length} search results`);
			await publish(resultsChannel(uuid).webSearchResults(searchResults));
			maxRounds -= 1;
			// If we're on the last round, generate the answer
			if (maxRounds === 0) {
				logger.info('Generating answer (due to being out of steps)...');
				const answer = await step.run(
					'generate-answer-out-of-rounds',
					async () => {
						let rawAnswer: string;
						if (extractedFacts.length > 0) {
							rawAnswer = await b.CreateAnswerFromFacts(
								new Date().toLocaleDateString(),
								args.research_topic,
								extractedFacts,
							);
							// Create sources map from all search results for citation lookup
							const sourcesMap = new Map(
								allSearchResults.map((result) => [
									result.id || '',
									{ url: result.url || '', title: result.title || null },
								]),
							);
							return processFootnotes(rawAnswer, extractedFacts, sourcesMap);
						}
						rawAnswer = await b.CreateAnswer(
							new Date().toLocaleDateString(),
							args.research_topic,
							allSearchResults,
						);
						return processFootnotes(rawAnswer, allSearchResults);
					},
				);
				logger.info('Publishing final answer');
				await publish(resultsChannel(uuid).finalAnswer(answer));
				return answer;
			}

			// Otherwise, reflect on the results using the new multi-step approach
			logger.info(`Reflecting on ${searchResults.length} search results...`);
			logger.info(
				`Current answered questions: ${JSON.stringify(Array.from(answeredQuestions))}`,
			);
			logger.info(
				`Current unanswered questions: ${JSON.stringify(getUnansweredQuestions())}`,
			);
			logger.info(
				`Query plan: ${JSON.stringify(initialQueryInformation.queryPlan)}`,
			);

			const reflection: Reflection = await step.run(
				'reflect-on-results',
				async () => {
					const reflection = await b.Reflect(
						searchResults, // Only current batch for analysis
						args.research_topic,
						new Date().toLocaleDateString(),
						initialQueryInformation.queryPlan,
						Array.from(answeredQuestions),
						getUnansweredQuestions(),
						knowledgeGapHistory.currentGapIndex != null &&
							knowledgeGapHistory.currentGapIndex >= 0
							? (knowledgeGapHistory.gaps[knowledgeGapHistory.currentGapIndex]
									?.description ?? null)
							: null,
						currentRound,
						originalMaxRounds,
					);
					if (!reflection) {
						throw new NonRetriableError('Reflection is null');
					}

					// Debug logging for reflection results
					logger.info(
						`Reflection result: ${JSON.stringify({
							isSufficient: reflection.isSufficient,
							answeredQuestions: reflection.answeredQuestions,
							unansweredQuestions: reflection.unansweredQuestions,
							currentGapClosed: reflection.currentGapClosed,
							newGapsIdentified: reflection.newGapsIdentified,
							relevantSummaryIdsCount: reflection.relevantSummaryIds.length,
						})}`,
					);

					return reflection;
				},
			);

			// Add newly answered questions to our external tracking (additive only)
			for (const questionIndex of reflection.answeredQuestions) {
				answeredQuestions.add(questionIndex);
			}

			logger.info('Reflection Completed; publishing reflection.');
			await publish(resultsChannel(uuid).reflection(reflection));

			// Run concurrent knowledge gap analysis and fact extraction
			const [gapAnalysis, newExtractedFacts] = await Promise.all([
				// Knowledge gap analysis (if research is not sufficient)
				reflection.isSufficient
					? null
					: step.run('analyze-knowledge-gaps', async () => {
							return await b.AnalyzeKnowledgeGaps(
								knowledgeGapHistory,
								reflection,
								initialQueryInformation.queryPlan,
								currentRound,
							);
						}),
				// Fact extraction (if relevant sources identified)
				reflection.relevantSummaryIds.length > 0
					? step.run('extract-relevant-facts', async () => {
							const relevantSources = searchResults.filter((summary) =>
								reflection.relevantSummaryIds.includes(summary.id),
							);

							logger.info(
								`Extracting facts from ${relevantSources.length} relevant sources...`,
							);

							const extractedFactsResult = await b.ExtractRelevantFacts(
								relevantSources,
								args.research_topic,
								initialQueryInformation.queryPlan,
								reflection,
								new Date().toLocaleDateString(),
							);

							logger.info(
								`Extracted ${extractedFactsResult.length} fact sets.`,
							);

							return extractedFactsResult;
						})
					: null,
			]);

			// Add newly extracted facts to the collection
			if (newExtractedFacts) {
				extractedFacts.push(...newExtractedFacts);
				// Publish fact extraction results
				await publish(resultsChannel(uuid).summarization(newExtractedFacts));
			}

			// Emit knowledge gap analysis results and update history
			if (gapAnalysis) {
				// Update knowledge gap history based on analysis
				knowledgeGapHistory.gaps = gapAnalysis.updatedGapHistory;

				logger.info(
					`Gap analysis completed: ${JSON.stringify({
						shouldContinueResearch: gapAnalysis.shouldContinueResearch,
						nextGapToResearch: gapAnalysis.nextGapToResearch,
						gapStatus: gapAnalysis.gapStatus,
						reasoning: gapAnalysis.reasoning,
					})}`,
				);

				await publish(resultsChannel(uuid).knowledgeGapAnalysis(gapAnalysis));
			}

			// Check if research is sufficient or we should continue
			if (reflection.isSufficient || !gapAnalysis?.shouldContinueResearch) {
				logger.info(
					'Research indicated as sufficient or no more gaps to pursue; generating answer...',
				);
				logger.info(
					`Final answered questions: ${JSON.stringify(reflection.answeredQuestions)}`,
				);
				logger.info(
					`Final unanswered questions: ${JSON.stringify(reflection.unansweredQuestions)}`,
				);
				logger.info(
					`Using ${extractedFacts.length > 0 ? extractedFacts.length : allSearchResults.length} sources for answer generation`,
				);

				const answer = await step.run(
					'generate-answer-sufficient',
					async () => {
						let rawAnswer: string;
						if (extractedFacts.length > 0) {
							rawAnswer = await b.CreateAnswerFromFacts(
								new Date().toLocaleDateString(),
								args.research_topic,
								extractedFacts,
							);
							// Create sources map from all search results for citation lookup
							const sourcesMap = new Map(
								allSearchResults.map((result) => [
									result.id || '',
									{ url: result.url || '', title: result.title || null },
								]),
							);
							return processFootnotes(rawAnswer, extractedFacts, sourcesMap);
						}
						rawAnswer = await b.CreateAnswer(
							new Date().toLocaleDateString(),
							args.research_topic,
							allSearchResults,
						);
						return processFootnotes(rawAnswer, allSearchResults);
					},
				);
				logger.info('Publishing final answer');
				await publish(resultsChannel(uuid).finalAnswer(answer));
				return answer;
			}

			// Generate follow-up queries based on knowledge gap analysis
			const followUpQueries = await step.run(
				'generate-followup-queries',
				async () => {
					return await b.GenerateFollowUpQueries(
						gapAnalysis.nextGapToResearch ??
							'Continue research based on unanswered questions',
						getCurrentGapPreviousQueries(
							knowledgeGapHistory,
							gapAnalysis.nextGapToResearch ?? null,
						),
						reflection,
						initialQueryInformation.queryPlan,
						currentRound,
						getUnansweredQuestions(),
					);
				},
			);

			// Update current gap index if switching to a new gap
			if (
				gapAnalysis.gapStatus === 'new' ||
				gapAnalysis.gapStatus === 'switching'
			) {
				const gapIndex = knowledgeGapHistory.gaps.findIndex(
					(gap) => gap.description === gapAnalysis.nextGapToResearch,
				);
				knowledgeGapHistory.currentGapIndex = gapIndex;
			}

			logger.info(
				`Generated ${followUpQueries.queries.length} follow-up queries for next round`,
			);
			await publish(
				resultsChannel(uuid).followUpQueryGeneration(followUpQueries),
			);

			queries = followUpQueries.queries;
			logger.info(
				`Gap analysis indicated more data needed; trying ${followUpQueries.queries.length} follow-up queries...`,
			);

			// Increment round counter for next iteration
			currentRound += 1;
		}
	},
);

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

function isDeepResearchQuery(data: any): data is DeepResearchInvocation {
	if (data.research_topic && data.current_date) {
		return true;
	}
	return false;
}
