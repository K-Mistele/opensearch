import { exa } from "@/inngest/functions/execute-searches";
import { type SearchResult, b } from "@baml-client";
import { describe, it } from "bun:test";

describe("Reflection Pipeline tests", async () => {
	it("Whole pipeline tests", async () => {
		const researchTopic =
			"Has Constellate AI, the Dallas-based AI startup at constellate.ai, raised a Series A?";
		const queryResult = await b.GenerateQuery({
			number_queries: 5,
			research_topic: researchTopic,
			current_date: new Date().toLocaleDateString(),
		});

		const searchResults: Array<SearchResult[]> = await Promise.all(
			queryResult.query.map(
				(query) =>
					new Promise<SearchResult[]>((resolve) => {
						exa
							.searchAndContents(query, {
								numResults: 10,
								text: true,
								highlights: true,
							})
							.then((result) => resolve(result.results));
					}),
			),
		);
		const flattenedSearchResults = searchResults.flat();

		const reflectionResult = await b.Reflect(
			searchResults.flat(),
			researchTopic,
		);
		console.log(reflectionResult);
	});
});
