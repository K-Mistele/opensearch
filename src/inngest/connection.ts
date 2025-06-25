import { connect } from "inngest/connect";
import { inngest } from "./client";
import { executeSearches } from "./functions/execute-searches";
import { generateQuery } from "./functions/generate-query";

export const connection = await connect({
	apps: [{ client: inngest, functions: [executeSearches, generateQuery] }],
	//instanceId: "opensearch",
});
