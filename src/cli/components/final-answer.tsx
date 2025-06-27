import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';
import { MarkdownRenderer } from './markdown-renderer';

type FinalAnswerProps =
	| {
			isGenerating: true;
			relevantSummariesCount: number;
	  }
	| {
			isGenerating: false;
			answer: string;
			relevantSummariesCount: number;
	  };

export const FinalAnswer: React.FC<FinalAnswerProps> = (props) => {
	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="green"
			paddingX={2}
			paddingY={1}
			marginBottom={1}
			overflow="visible"
		>
			<Box marginBottom={1}>
				<Text bold color="green">
					📝 Final Answer Generation
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray">
					Synthesizing insights from {props.relevantSummariesCount} sources...
				</Text>
			</Box>

			{props.isGenerating ? (
				<Box marginBottom={1}>
					<Text color="green">
						<Spinner type="dots" /> Creating comprehensive research summary...
					</Text>
				</Box>
			) : (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text bold color="green">
							✓ Research Complete
						</Text>
					</Box>

					<Box flexDirection="column">
						<MarkdownRenderer content={props.answer} />
					</Box>
				</Box>
			)}
		</Box>
	);
};
