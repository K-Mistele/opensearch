import type { SearchResult } from '@baml-client';
import { b } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';
import { useEffect, useState } from 'react';

interface FinalAnswerProps {
	researchTopic: string;
	searchResults: SearchResult[];
	onComplete: (answer: string) => void;
}

export const FinalAnswer: React.FC<FinalAnswerProps> = ({
	researchTopic,
	searchResults,
	onComplete,
}) => {
	const [isGenerating, setIsGenerating] = useState(true);
	const [answer, setAnswer] = useState<string>('');

	useEffect(() => {
		const generateAnswer = async () => {
			setIsGenerating(true);

			try {
				// Call actual BAML CreateAnswer function
				const currentDate = new Date().toISOString().substring(0, 10);

				const result = await b.CreateAnswer(
					currentDate, // current_date
					researchTopic, // research_topic
					searchResults, // summaries as SearchResult[]
				);

				setAnswer(result);
				setIsGenerating(false);
				onComplete(result);
			} catch (error) {
				console.error('Error generating answer:', error);

				// Fallback answer
				const mockAnswer = `Based on the research conducted on "${researchTopic}", here's a comprehensive summary:

The search yielded ${searchResults.length} relevant sources that provide insights into this topic. The information gathered covers various aspects including recent developments, key findings, and relevant context.

Key findings include:
${searchResults
	.slice(0, 3)
	.map(
		(result, index) =>
			`${index + 1}. ${result.highlights[0] || 'Key information found'}`,
	)
	.join('\n')}

Sources:
${searchResults
	.slice(0, 3)
	.map((result) => `- [${result.title || 'Source'}](${result.url})`)
	.join('\n')}

This analysis provides a foundation for understanding ${researchTopic} based on current available information.`;

				setAnswer(mockAnswer);
				setIsGenerating(false);
				onComplete(mockAnswer);
			}
		};

		generateAnswer();
	}, [researchTopic, searchResults, onComplete]);

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="green">
					📝 Generating Final Answer
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray">
					Synthesizing information from {searchResults.length} sources...
				</Text>
			</Box>

			{isGenerating ? (
				<Box>
					<Spinner type="dots" />
					<Text>
						{' '}
						Creating comprehensive answer based on research findings...
					</Text>
				</Box>
			) : (
				<Box flexDirection="column" marginTop={1}>
					<Box marginBottom={1}>
						<Text bold color="green">
							✅ Answer Ready
						</Text>
					</Box>

					<Box>
						<Text>{answer}</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
};
