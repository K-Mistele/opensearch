import { inngest } from "@/inngest/client";
import type { GenerateQueryArgs, SearchQueryList } from "@baml-client";
import { b } from "@baml-client";
import { NonRetriableError } from "inngest";

export const generateQuery = inngest.createFunction(
	{
		id: "generate-query",
		concurrency: {
			limit: 20,
		},
		retries: 5,
	},
	{ event: "research/query.requested" },
	async ({ event, step, logger }) => {
		const args = event.data as GenerateQueryArgs;
		if (!args.research_topic)
			throw new NonRetriableError("No research topic provided!");
		if (!args.current_date)
			throw new NonRetriableError("No current date provided!");
		logger.info("Generating query", args);
		const query = await step.run("generate-query", async () =>
			b.GenerateQuery(args),
		);
		logger.info("Query generated", query);
		return {
			...query,
		} satisfies SearchQueryList;
	},
);
