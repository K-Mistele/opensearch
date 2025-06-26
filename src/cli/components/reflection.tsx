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
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="purple">
					🤔 Analyzing Search Results
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray">
					Found {props.searchResultsLength} search results - analyzing for
					completeness...
				</Text>
			</Box>

			{props.isReflecting ? (
				<Box>
					<Spinner type="dots" />
					<Text>
						{' '}
						Evaluating information quality and identifying knowledge gaps...
					</Text>
				</Box>
			) : (
				props.reflection && (
					<Box flexDirection="column" marginTop={1}>
						<Box marginBottom={1}>
							<Text
								bold
								color={props.reflection.isSufficient ? 'green' : 'yellow'}
							>
								{props.reflection.isSufficient
									? '✅ Analysis Complete - Sufficient'
									: '⚠️ Analysis Complete - Gaps Found'}
							</Text>
						</Box>

						<Box marginBottom={1}>
							<Text bold>Analysis Results:</Text>
							<Text>
								• Information Sufficient:{' '}
								<Text color={props.reflection.isSufficient ? 'green' : 'red'}>
									{props.reflection.isSufficient ? 'Yes' : 'No'}
								</Text>
							</Text>
						</Box>

						{!props.reflection.isSufficient &&
							props.reflection.knowledgeGap && (
								<Box marginBottom={1}>
									<Text bold color="yellow">
										Knowledge Gap Identified:
									</Text>
									<Text color="yellow">{props.reflection.knowledgeGap}</Text>
								</Box>
							)}

						{!props.reflection.isSufficient &&
							props.reflection.followUpQueries && (
								<Box>
									<Text bold>Follow-up Queries to Generate:</Text>
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
