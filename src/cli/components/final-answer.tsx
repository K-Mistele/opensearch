import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

type FinalAnswerProps =
	| {
			isGenerating: true;
			searchResultsLength: number;
	  }
	| {
			isGenerating: false;
			answer: string;
			searchResultsLength: number;
	  };

export const FinalAnswer: React.FC<FinalAnswerProps> = (props) => {
	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="green">
					📝 Generating Final Answer
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray">
					Synthesizing information from {props.searchResultsLength} sources...
				</Text>
			</Box>

			{props.isGenerating ? (
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
						<Text>{props.answer}</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
};
