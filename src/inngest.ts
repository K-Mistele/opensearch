import { Inngest } from "inngest";
import { connect } from "inngest/connect";

export const inngest = new Inngest({
	id: "opensearch",
	isDev: true,
	baseUrl: "http://localhost:8288",
});

const searchFunction = inngest.createFunction(
	{
		id: "search-company-rounds",
		concurrency: {
			scope: "fn",
			limit: 20,
		},
		retries: 5,
	},
	{ event: "yc-enrichment/search-company-rounds" },
	async ({ event, step, logger }) => {
		const company = event.data.com;
	},
);
export const functions = [];

export const connection = await connect({
	apps: [{ client: inngest, functions }],
});
