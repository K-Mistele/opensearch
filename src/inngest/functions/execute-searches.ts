import { inngest } from '@/inngest/client';
import { requireEnvironment } from '@/utils';
import type { SearchResult } from '@baml-client';
import Exa from 'exa-js';
import { NonRetriableError } from 'inngest';

export const exa = new Exa(requireEnvironment('EXA_API_KEY'));

export const executeSearches = inngest.createFunction(
	{
		id: 'execute-exa-searches',

		// Exa rate limit for individual accounts is 5 requests per second - https://docs.exa.ai/reference/rate-limits
		throttle: {
			limit: 5,
			period: '1s',
		},
		retries: 3,
	},
	{ event: 'research/searches.requested' },
	async ({ event, step, logger }): Promise<Array<SearchResult>> => {
		if (!event.data.query || typeof event.data.query !== 'string')
			throw new NonRetriableError('Malformed event.data.query:', event.data);

		logger.info('Searching for query:', event.data.query);
		if (event.data.numResults)
			logger.info('Number of results per query:', event.data.numResults);

		// Execute the queries
		const queryResults: Array<SearchResult> = await step.run(
			'execute-exa-searches',
			async () => {
				const result = await exa.searchAndContents(event.data.query, {
					numResults: event.data.numResults ?? 10,
					text: true,
					highlights: true,
				});
				return result.results;
			},
		);

		logger.info('got results in execute searches', queryResults[0]);

		return queryResults;
	},
);
