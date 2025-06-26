import type { Query, SearchResult } from '@baml-client';
import Exa from 'exa-js';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';
import { useEffect, useState } from 'react';
import { nanoid, requireEnvironment } from '../../utils';

// Initialize Exa client
const exa = new Exa(requireEnvironment('EXA_API_KEY'));

interface SearchResultsProps {
	queries: Query[];
	onComplete: (results: SearchResult[]) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
	queries,
	onComplete,
}) => {
	const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
	const [allResults, setAllResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(true);
	const [queryResults, setQueryResults] = useState<{ [key: number]: number }>(
		{},
	);

	useEffect(() => {
		if (queries.length === 0) return;

		const searchAllQueries = async () => {
			setIsSearching(true);
			const allResults: SearchResult[] = [];

			for (let i = 0; i < queries.length; i++) {
				setCurrentQueryIndex(i);

				try {
					// Perform actual web search using Exa
					const result = await exa.searchAndContents(queries[i]?.query || '', {
						numResults: 10,
						text: true,
						highlights: true,
					});

					const searchResults: SearchResult[] = result.results;
					allResults.push(
						...searchResults.map((sr) => ({ ...sr, id: nanoid() })),
					);

					// Track results count for this query
					setQueryResults((prev) => ({ ...prev, [i]: searchResults.length }));
				} catch (error) {
					console.error(
						`Error searching for query "${queries[i]?.query}":`,
						error,
					);
					// Track zero results for this query on error
					setQueryResults((prev) => ({ ...prev, [i]: 0 }));
				}

				// Add a small delay between searches to respect rate limits
				if (i < queries.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 200));
				}
			}

			setAllResults(allResults);
			setIsSearching(false);
			onComplete(allResults);
		};

		searchAllQueries();
	}, [queries, onComplete]);

	if (queries.length === 0) {
		return null;
	}

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="blue">
					🔍 Executing Web Searches
				</Text>
			</Box>

			<Box flexDirection="column">
				{queries.map((query, index) => (
					<Box key={`query-${query.query}-${index}`} marginBottom={1}>
						<Box marginRight={2}>
							{index < currentQueryIndex && <Text color="green">✅</Text>}
							{index === currentQueryIndex && isSearching && (
								<Spinner type="dots" />
							)}
							{index === currentQueryIndex && !isSearching && (
								<Text color="green">✅</Text>
							)}
							{index > currentQueryIndex && <Text color="gray">⏳</Text>}
						</Box>
						<Box flexGrow={1}>
							<Text color={index <= currentQueryIndex ? 'white' : 'gray'}>
								{query.query}
							</Text>
						</Box>
						{index < currentQueryIndex && queryResults[index] !== undefined && (
							<Box marginLeft={2}>
								<Text color="cyan">({queryResults[index]} results)</Text>
							</Box>
						)}
						{index === currentQueryIndex &&
							!isSearching &&
							queryResults[index] !== undefined && (
								<Box marginLeft={2}>
									<Text color="cyan">({queryResults[index]} results)</Text>
								</Box>
							)}
					</Box>
				))}
			</Box>

			{!isSearching && (
				<Box marginTop={1}>
					<Text bold color="green">
						✅ All searches complete! Found {allResults.length} total results
					</Text>
				</Box>
			)}
		</Box>
	);
};
