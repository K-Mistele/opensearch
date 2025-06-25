import { inngest } from "@/inngest/client";
import { requireEnvironment } from "@/utils";
import type { SearchResult } from "@baml-client";
import Exa from "exa-js";
import { NonRetriableError } from "inngest";

export const exa = new Exa(requireEnvironment("EXA_API_KEY"));

export const executeSearches = inngest.createFunction(
	{
		id: "execute-exa-searches",

		// Exa rate limit for individual accounts is 5 requests per second - https://docs.exa.ai/reference/rate-limits
		throttle: {
			limit: 5,
			period: "1s",
		},
		retries: 3,
	},
	{ event: "research/searches.requested" },
	async ({ event, step, logger }): Promise<Array<SearchResult>> => {
		if (!event.data.queries || !Array.isArray(event.data.queries))
			throw new NonRetriableError("Malformed event.data.queries:", event.data);

		logger.info("Searching for queries:", event.data.queries);
		if (event.data.numResults)
			logger.info("Number of results per query:", event.data.numResults);

		const queries: Array<SearchResult> = await step.run(
			"execute-exa-searches",
			async () => {
				const promises = [];
				for (const query of event.data.queries) {
					const promise = new Promise((resolve, reject) => {
						exa
							.searchAndContents(query, {
								numResults: event.data.numResults ?? 10,
								text: true,
								highlights: true,
							})
							.then((result) => {
								logger.info("Exa search result:", result);
								resolve(result.results);
							})
							.catch((error) => {
								logger.error(
									`Error executing exa search for query: ${query}`,
									error,
								);
								reject(error);
							});
					});
					promises.push(promise);
				}
				return Promise.all(promises);
			},
		);

		return queries;
	},
);
