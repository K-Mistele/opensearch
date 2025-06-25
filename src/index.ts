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
import { connection } from "@/inngest/connection";

console.log(`Inngest connected: ${connection.state}`);
