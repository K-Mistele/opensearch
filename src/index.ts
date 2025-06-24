import { b } from "../baml_client";
/**
 * Flow:
 * 1. generate a list of queries
 * 2. web research for each query
 * 3. reflect on the web search results
 * 4. after reflection, can EITHER  go back to web research OR to finalize answer
 */

/**
 * Web research flow:
 * execute a web search  with sources gathered, web research results. generate a search, let it iteratively search
 */

await b.GenerateQuery({
	research_topic: "Naptha AI funding round amount and series",
	current_date: "06/24/2025",
	number_queries: 10,
});
