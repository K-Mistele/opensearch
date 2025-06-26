import type { Query, SearchResult } from "@baml-client";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type React from "react";
import { useEffect, useState } from "react";

interface SearchResultsProps {
	queries: Query[];
	onComplete: (results: SearchResult[]) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
	queries,
	onComplete,
}) => {
	const [isSearching, setIsSearching] = useState(true);
	const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
	const [results, setResults] = useState<SearchResult[]>([]);

	useEffect(() => {
		const executeSearches = async () => {
			setIsSearching(true);
			const allResults: SearchResult[] = [];

			for (let i = 0; i < queries.length; i++) {
				setCurrentQueryIndex(i);

				// TODO: Replace with actual web search implementation
				// This would integrate with your web search service
				await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate search delay

				// Mock search results
				const mockResults: SearchResult[] = [
					{
						id: `result_${i}_1`,
						url: `https://example.com/article${i}1`,
						title: `Article about ${queries[i]?.query || "search query"}`,
						highlights: [
							`Key information about ${queries[i]?.query || "topic"}`,
							"Relevant details found",
						],
						highlightScores: [0.9, 0.8],
						text: `Full text content related to ${queries[i]?.query || "search"}...`,
					},
					{
						id: `result_${i}_2`,
						url: `https://example.com/article${i}2`,
						title: `Research on ${queries[i]?.query || "search query"}`,
						highlights: [
							`Research findings for ${queries[i]?.query || "topic"}`,
							"Additional context",
						],
						highlightScores: [0.85, 0.75],
						text: `Research content about ${queries[i]?.query || "search"}...`,
					},
				];

				allResults.push(...mockResults);
			}

			setResults(allResults);
			setIsSearching(false);
			onComplete(allResults);
		};

		executeSearches();
	}, [queries, onComplete]);

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="blue">
					🔍 Executing Web Searches
				</Text>
			</Box>

			{queries.map((query, index) => (
				<Box
					key={query.query}
					flexDirection="column"
					marginBottom={1}
					paddingLeft={2}
				>
					<Box>
						{index < currentQueryIndex ? (
							<Text color="green">✅ </Text>
						) : index === currentQueryIndex && isSearching ? (
							<Spinner type="dots" />
						) : (
							<Text color="gray">⏳ </Text>
						)}
						<Text color={index <= currentQueryIndex ? "white" : "gray"}>
							{query.query}
						</Text>
					</Box>

					{index === currentQueryIndex && isSearching && (
						<Box paddingLeft={4} marginTop={1}>
							<Text color="gray" dimColor>
								Searching web sources...
							</Text>
						</Box>
					)}
				</Box>
			))}

			{!isSearching && (
				<Box marginTop={1}>
					<Text bold color="green">
						✅ Found {results.length} search results from {queries.length}{" "}
						queries
					</Text>
				</Box>
			)}
		</Box>
	);
};
