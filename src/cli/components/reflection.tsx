import type { Reflection } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

type ReflectionStepProps = {
	researchTopic: string;
	searchResultsLength: number;
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
				</Text>
			</Box>

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

						{!props.reflection.isSufficient &&
							props.reflection.knowledgeGap && (
								<Box marginBottom={1} flexDirection="column">
									<Text bold color="yellow">
										Knowledge Gap:
									</Text>
									<Text color="yellow">{props.reflection.knowledgeGap}</Text>
								</Box>
							)}

						{props.reflection.answeredQuestions &&
							props.reflection.answeredQuestions.length > 0 && (
								<Box marginBottom={1} flexDirection="column">
									<Text bold color="green">
										Questions Answered:
									</Text>
									{props.reflection.answeredQuestions.map((question) => (
										<Text key={question} color="green">
											✓ {question}
										</Text>
									))}
								</Box>
							)}

						{props.reflection.unansweredQuestions &&
							props.reflection.unansweredQuestions.length > 0 && (
								<Box marginBottom={1} flexDirection="column">
									<Text bold color="yellow">
										Questions Still Needed:
									</Text>
									{props.reflection.unansweredQuestions.map((question) => (
										<Text key={question} color="yellow">
											• {question}
										</Text>
									))}
								</Box>
							)}

						{props.reflection.relevantSummaryIds &&
							props.reflection.relevantSummaryIds.length > 0 && (
								<Box marginBottom={1} flexDirection="column">
									<Text bold color="cyan">
										Relevant Sources Identified:
									</Text>
									<Text color="gray">
										Found {props.reflection.relevantSummaryIds.length} unique,
										non-duplicate sources with relevant information
									</Text>
								</Box>
							)}

						{!props.reflection.isSufficient &&
							props.reflection.followUpQueries && (
								<Box marginBottom={1} flexDirection="column">
									<Text bold color="white">
										Follow-up Queries Needed:
									</Text>
									{props.reflection.followUpQueries.map((query, index) => (
										<Text key={query} color="cyan">
											• {query}
										</Text>
									))}
								</Box>
							)}

						{props.reflection.isSufficient && (
							<Box flexDirection="column">
								<Text color="green">
									✓ Ready to generate comprehensive answer
								</Text>
							</Box>
						)}
					</Box>
				)
			)}
		</Box>
	);
};
