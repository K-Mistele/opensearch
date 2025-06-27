import type { SearchResult } from '@baml-client';
import Exa from 'exa-js';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';
import { requireEnvironment } from '../../utils';

// Initialize Exa client
const exa = new Exa(requireEnvironment('EXA_API_KEY'));

interface SearchResultsProps {
	queries: Record<string, 'pending' | 'completed'>;
	isSearching: boolean;
	searchResults: Array<SearchResult>;
}

export const SearchResults: React.FC<SearchResultsProps> = (props) => {
	const { queries, isSearching, searchResults } = props;

	return (
		<Box
			flexDirection="column"
			paddingX={2}
			paddingY={1}
			borderStyle="round"
			borderColor="cyan"
			marginBottom={1}
		>
			<Box marginBottom={1}>
				<Text bold color="cyan">
					🔍 Web Search Execution
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray">
					Executing {Object.keys(queries).length} search queries...
				</Text>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				{Object.entries(queries).map(([query, status], index) => (
					<Box key={`query-${query}`}>
						{status === 'pending' ? (
							<Text color="cyan">
								<Spinner type="dots" /> {query}
							</Text>
						) : (
							<Text color="green">✓ {query}</Text>
						)}
					</Box>
				))}
			</Box>

			{!isSearching && (
				<Box>
					<Text bold color="green">
						✓ Search Complete - Found {searchResults.length} results
					</Text>
				</Box>
			)}
		</Box>
	);
};
