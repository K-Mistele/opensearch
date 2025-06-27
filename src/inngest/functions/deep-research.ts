import type {
	ExtractedFact,
	GenerateQueryArgs,
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

		// Track which questions from the query plan have been answered
		let answeredQuestions: Array<number> = [];
		let unansweredQuestions: Array<number> =
			initialQueryInformation.queryPlan.map((_, index) => index);

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

			// Otherwise, reflect on the results. force a retry if it's non-sufficient and has no follow-up queries
			logger.info(`Reflecting on ${searchResults.length} search results...`);
			logger.info(
				`Current answered questions: ${JSON.stringify(answeredQuestions)}`,
			);
			logger.info(
				`Current unanswered questions: ${JSON.stringify(unansweredQuestions)}`,
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
						answeredQuestions,
						unansweredQuestions,
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
							knowledgeGap: reflection.knowledgeGap,
							followUpQueriesCount: reflection.followUpQueries?.length || 0,
							relevantSummaryIdsCount: reflection.relevantSummaryIds.length,
						})}`,
					);

					if (!reflection.isSufficient && !reflection.followUpQueries) {
						throw new Error(
							'Reflection is not sufficient and has no follow-up queries',
						);
					}
					return reflection;
				},
			);

			// Update question tracking based on reflection results
			answeredQuestions = reflection.answeredQuestions;
			unansweredQuestions = reflection.unansweredQuestions;

			logger.info('Reflection Completed; publishing reflection.');
			await publish(resultsChannel(uuid).reflection(reflection));

			// Extract facts from relevant sources if any were identified
			if (reflection.relevantSummaryIds.length > 0) {
				const relevantSources = searchResults.filter((summary) =>
					reflection.relevantSummaryIds.includes(summary.id),
				);

				logger.info(
					`Extracting facts from ${relevantSources.length} relevant sources...`,
				);

				// Extract facts from relevant sources
				const newExtractedFacts = await step.run(
					'extract-relevant-facts',
					async () => {
						return await b.ExtractRelevantFacts(
							relevantSources,
							args.research_topic,
							initialQueryInformation.queryPlan,
							reflection,
							new Date().toLocaleDateString(),
						);
					},
				);

				extractedFacts.push(...newExtractedFacts);

				logger.info(
					`Extracted ${newExtractedFacts.length} fact sets. Total extracted facts: ${extractedFacts.length}`,
				);

				// Publish fact extraction results
				await publish(resultsChannel(uuid).summarization(newExtractedFacts));
			}

			// check if we should go again
			if (reflection.isSufficient) {
				logger.info(
					'Reflection indicated search data is sufficient; generating answer...',
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

			// Otherwise generate the next query for the next loop.

			if (!reflection.followUpQueries) {
				throw new NonRetriableError(
					'Reflection is not sufficient and has no follow-up queries',
				);
			}
			queries = reflection.followUpQueries;
			logger.info(
				`Reflection indicated more data needed; trying ${reflection.followUpQueries.length} follow-up queries...`,
			);

			// Increment round counter for next iteration
			currentRound += 1;
		}
	},
);

function isDeepResearchQuery(data: any): data is DeepResearchInvocation {
	if (data.research_topic && data.current_date) {
		return true;
	}
	return false;
}
