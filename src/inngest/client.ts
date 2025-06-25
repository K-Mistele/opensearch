import { Inngest } from "inngest";
import { requireEnvironment } from "../utils";

export const inngest = new Inngest({
	id: "opensearch2",
	isDev: process.env.NODE_ENV !== "production",
	baseUrl: requireEnvironment("INNGEST_BASE_URL"),
});
