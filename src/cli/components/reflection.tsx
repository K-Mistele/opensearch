import type { Reflection, SearchResult } from '@baml-client';
import { b } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';
import { useEffect, useState } from 'react';

interface ReflectionStepProps {
	researchTopic: string;
	searchResults: SearchResult[];
	onComplete: (reflection: Reflection) => void;
}

export const ReflectionStep: React.FC<ReflectionStepProps> = ({
	researchTopic,
	searchResults,
	onComplete,
}) => {
	const [isReflecting, setIsReflecting] = useState(true);
	const [reflection, setReflection] = useState<Reflection | null>(null);

	useEffect(() => {
		const performReflection = async () => {
			setIsReflecting(true);

			try {
				// Call actual BAML Reflect function
				const result = await b.Reflect(
					searchResults,
					researchTopic,
					new Date().toLocaleDateString(),
				);

				setReflection(result);
				setIsReflecting(false);
				onComplete(result);
			} catch (error) {
				console.error('Error during reflection:', error);

				// Fallback reflection
				const mockReflection: Reflection = {
					isSufficient: Math.random() > 0.5, // Randomly decide for demo
					knowledgeGap:
						'Need more specific information about recent developments',
					followUpQueries: [
						`${researchTopic} 2024 updates`,
						`${researchTopic} latest developments`,
					],
					followupQueriesRationale: [
						'To get the most current information',
						'To understand recent changes and developments',
					],
				};

				setReflection(mockReflection);
				setIsReflecting(false);
				onComplete(mockReflection);
			}
		};

		performReflection();
	}, [researchTopic, searchResults, onComplete]);

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="purple">
					🤔 Analyzing Search Results
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray">
					Found {searchResults.length} search results - analyzing for
					completeness...
				</Text>
			</Box>

			{isReflecting ? (
				<Box>
					<Spinner type="dots" />
					<Text>
						{' '}
						Evaluating information quality and identifying knowledge gaps...
					</Text>
				</Box>
			) : (
				reflection && (
					<Box flexDirection="column" marginTop={1}>
						<Box marginBottom={1}>
							<Text bold color={reflection.isSufficient ? 'green' : 'yellow'}>
								{reflection.isSufficient
									? '✅ Analysis Complete - Sufficient'
									: '⚠️ Analysis Complete - Gaps Found'}
							</Text>
						</Box>

						<Box marginBottom={1}>
							<Text bold>Analysis Results:</Text>
							<Text>
								• Information Sufficient:{' '}
								<Text color={reflection.isSufficient ? 'green' : 'red'}>
									{reflection.isSufficient ? 'Yes' : 'No'}
								</Text>
							</Text>
						</Box>

						{!reflection.isSufficient && reflection.knowledgeGap && (
							<Box marginBottom={1}>
								<Text bold color="yellow">
									Knowledge Gap Identified:
								</Text>
								<Text color="yellow">{reflection.knowledgeGap}</Text>
							</Box>
						)}

						{!reflection.isSufficient && reflection.followUpQueries && (
							<Box>
								<Text bold>Follow-up Queries to Generate:</Text>
								{reflection.followUpQueries.map((query, index) => (
									<Text key={query} color="cyan">
										• {query}
									</Text>
								))}
							</Box>
						)}

						{reflection.isSufficient && (
							<Box>
								<Text color="green">
									Ready to generate comprehensive answer based on gathered
									information.
								</Text>
							</Box>
						)}
					</Box>
				)
			)}
		</Box>
	);
};
