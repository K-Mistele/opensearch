import Exa from "exa-js";
import { requireEnvironment } from "./utils";

export const exa = new Exa(requireEnvironment("EXA_API_KEY"));

export async function runExaSearch(options: {
	query: string;
	numResults?: number;
}) {
	const results = await exa.searchAndContents(options.query, {
		numResults: options.numResults ?? 10,
		text: true,
		highlights: true,
	});

	return results;
}
