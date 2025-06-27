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

						<Box marginBottom={1} flexDirection="column">
							<Box marginBottom={1}>
								<Text bold color="white">
									Information Assessment:
								</Text>
							</Box>
							<Box>
								<Text>
									• Sufficient Data:{' '}
									<Text color={props.reflection.isSufficient ? 'green' : 'red'}>
										{props.reflection.isSufficient ? 'Yes' : 'No'}
									</Text>
								</Text>
							</Box>
						</Box>

						{!props.reflection.isSufficient &&
							props.reflection.knowledgeGap && (
								<Box marginBottom={1}>
									<Text bold color="yellow">
										Knowledge Gap:
									</Text>
									<Text color="yellow">{props.reflection.knowledgeGap}</Text>
								</Box>
							)}

						{!props.reflection.isSufficient &&
							props.reflection.followUpQueries && (
								<Box marginBottom={1}>
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
							<Box>
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
