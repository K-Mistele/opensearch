import type { Reflection } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

type ReflectionStepProps = {
	researchTopic: string;
	searchResultsLength: number;
	queryPlan?: string[];
	roundNumber?: number;
} & (
	| {
			isReflecting: true;
	  }
	| {
			isReflecting: false;
			reflection: Reflection;
	  }
);

export const ReflectionStep: React.FC<ReflectionStepProps> = (props) => {
	const totalQuestions = props.queryPlan?.length || 0;
	const answeredCount = props.isReflecting
		? 0
		: props.reflection.answeredQuestions.length;
	const progressPercentage =
		totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

	return (
		<Box
			flexDirection="column"
			paddingX={2}
			paddingY={1}
			borderStyle="round"
			borderColor="magenta"
			marginBottom={1}
		>
			<Box marginBottom={1}>
				<Text bold color="magenta">
					🤔 Research Analysis
					{props.roundNumber ? ` (Round ${props.roundNumber})` : ''}
				</Text>
			</Box>

			{totalQuestions > 0 && (
				<Box marginBottom={1}>
					<Text color="gray">
						Progress: {answeredCount}/{totalQuestions} questions answered (
						{progressPercentage}%)
					</Text>
				</Box>
			)}

			<Box marginBottom={1}>
				<Text color="gray">
					Analyzing {props.searchResultsLength} search results for
					completeness...
				</Text>
			</Box>

			{props.isReflecting ? (
				<Box marginBottom={1}>
					<Text color="magenta">
						<Spinner type="dots" /> Evaluating information quality and
						identifying gaps...
					</Text>
				</Box>
			) : (
				props.reflection && (
					<Box flexDirection="column">
						<Box marginBottom={1}>
							<Text
								bold
								color={props.reflection.isSufficient ? 'green' : 'yellow'}
							>
								{props.reflection.isSufficient
									? '✓ Analysis Complete - Information Sufficient'
									: '⚠ Analysis Complete - Knowledge Gaps Found'}
							</Text>
						</Box>

						{/* Knowledge Gap */}
						{!props.reflection.isSufficient &&
							props.reflection.knowledgeGap && (
								<Box marginBottom={1} flexDirection="column">
									<Text bold color="yellow">
										Knowledge Gap:
									</Text>
									<Text color="white">{props.reflection.knowledgeGap}</Text>
								</Box>
							)}

						{/* Query Plan Progress */}
						{props.queryPlan && props.queryPlan.length > 0 && (
							<Box marginBottom={1} flexDirection="column">
								<Text bold color="cyan">
									Query Plan Progress:
								</Text>
								{props.queryPlan.map((question, index) => {
									const isAnswered =
										props.reflection.answeredQuestions.includes(index);
									return (
										<Text
											key={`question-${index}-${question.slice(0, 20)}`}
											color={isAnswered ? 'green' : 'red'}
										>
											{isAnswered ? '✓' : '⚠'} {question}
										</Text>
									);
								})}
							</Box>
						)}

						{/* Relevant Sources */}
						{props.reflection.relevantSummaryIds &&
							props.reflection.relevantSummaryIds.length > 0 && (
								<Box marginBottom={1} flexDirection="column">
									<Text bold color="cyan">
										Relevant Sources:
									</Text>
									<Text color="white">
										Found {props.reflection.relevantSummaryIds.length} unique
										sources with relevant information
									</Text>
								</Box>
							)}

						{/* Status */}
						{props.reflection.isSufficient ? (
							<Box flexDirection="column">
								<Text color="green">
									✓ Ready to generate comprehensive answer
								</Text>
							</Box>
						) : (
							<Box flexDirection="column">
								<Text color="yellow">
									⚠ Additional research needed - generating follow-up queries
								</Text>
							</Box>
						)}
					</Box>
				)
			)}
		</Box>
	);
};
