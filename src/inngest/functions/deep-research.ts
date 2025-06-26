import type {
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

		logger.info(`Executing ${initialQueryInformation.query.length} queries`);
		let queries: Array<string> = initialQueryInformation.query;
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
				console.log('result', result);
				result.id = nanoid();
				console.log(`Adding search result with ID: ${result.id}`);
				allSearchResults.push(result);
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
						const rawAnswer = await b.CreateAnswer(
							new Date().toLocaleDateString(),
							args.research_topic,
							allSearchResults,
						);
						// Process footnotes to convert random IDs to numbered ones
						return processFootnotes(rawAnswer, allSearchResults);
					},
				);
				logger.info('Publishing final answer');
				await publish(resultsChannel(uuid).finalAnswer(answer));
				return answer;
			}

			// Otherwise, reflect on the results. force a retry if it's non-sufficient and has no follow-up queries
			logger.info(`Reflecting on ${allSearchResults.length} search results...`);
			const reflection: Reflection = await step.run(
				'reflect-on-results',
				async () => {
					const reflection = await b.Reflect(
						allSearchResults,
						args.research_topic,
						new Date().toLocaleDateString(),
					);
					if (!reflection) {
						throw new NonRetriableError('Reflection is null');
					}
					if (!reflection.isSufficient && !reflection.followUpQueries) {
						throw new Error(
							'Reflection is not sufficient and has no follow-up queries',
						);
					}
					return reflection;
				},
			);
			logger.info('Reflection Completed; publishing reflection.');
			await publish(resultsChannel(uuid).reflection(reflection));

			// check if we should go again
			if (reflection.isSufficient) {
				logger.info(
					'Reflection indicated search data is sufficient; generating answer...',
				);
				const answer = await step.run(
					'generate-answer-sufficient',
					async () => {
						const rawAnswer = await b.CreateAnswer(
							new Date().toLocaleDateString(),
							args.research_topic,
							allSearchResults,
						);
						// Process footnotes to convert random IDs to numbered ones
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
		}
	},
);

function isDeepResearchQuery(data: any): data is DeepResearchInvocation {
	if (data.research_topic && data.current_date) {
		return true;
	}
	return false;
}
