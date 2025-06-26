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
			borderStyle="double"
			borderColor="cyan"
		>
			<Box marginBottom={1}>
				<Text bold color="blue">
					🔍 Executing Web Searches
				</Text>
			</Box>

			<Box flexDirection="column">
				{Object.entries(queries).map(([query, status], index) => (
					<Text key={`query-${query}`}>
						{status === 'pending' && <Spinner type="dots" />}
						{status === 'completed' && <Text color="green">✅</Text>}
						<Text color={status === 'pending' ? 'gray' : 'white'}>
							{' '}
							{query}
						</Text>
					</Text>
				))}
				{!props.isSearching && (
					<Text color="cyan">({searchResults.length} results)</Text>
				)}
			</Box>

			{!isSearching && (
				<Box marginTop={1}>
					<Text bold color="green">
						✅ All searches complete! Found {searchResults.length} total results
					</Text>
				</Box>
			)}
		</Box>
	);
};
