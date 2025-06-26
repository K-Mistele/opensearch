import type { Reflection, SearchQueryList } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

type QueryGenerationProps = {
	researchTopic: string;
} & (
	| {
			isFollowUp: true;
			previousReflection: Reflection;
	  }
	| {
			isFollowUp: false;
	  }
) &
	(
		| {
				isGenerating: true;
		  }
		| {
				isGenerating: false;
				queries: SearchQueryList;
		  }
		| {
				isGenerating: false;
				queries: null;
		  }
	);

export const QueryGeneration: React.FC<QueryGenerationProps> = (props) => {
	const { researchTopic, isFollowUp = false, isGenerating } = props;

	const genWord = props.isGenerating ? 'Generating' : 'Generated';

	return (
		<Box
			flexDirection="column"
			borderColor="blue"
			borderStyle="round"
			paddingX={2}
			paddingY={1}
		>
			<Box marginBottom={1}>
				<Text bold color="yellow">
					{isFollowUp
						? `🔄 ${genWord} Follow-Up Queries`
						: `🤖 ${genWord} Search Queries`}
				</Text>
			</Box>

			{isFollowUp &&
				'previousReflection' in props &&
				props.previousReflection?.knowledgeGap && (
					<Box marginBottom={1}>
						<Text color="gray">
							Knowledge Gap: {props.previousReflection.knowledgeGap}
						</Text>
					</Box>
				)}

			<Box marginBottom={1}>
				<Text color="gray">Research Topic: {researchTopic}</Text>
			</Box>

			{isGenerating ? (
				<Box>
					<Spinner type="dots" />
					<Text>
						{' '}
						Analyzing topic and generating optimized search queries...
					</Text>
				</Box>
			) : (
				'queries' in props &&
				props.queries && (
					<Box flexDirection="column" marginTop={1}>
						<Box marginBottom={1}>
							<Text bold color="green">
								✅ Queries Ready
							</Text>
						</Box>

						<Box marginBottom={1} flexDirection="column">
							<Text bold>Search Queries:</Text>
							{props.queries.query.map((query: string) => (
								<Text key={query} color="cyan">
									• {query}
								</Text>
							))}
						</Box>

						<Box flexDirection="column">
							<Text bold color="white">
								Rationale:
							</Text>
							<Text color="gray">{props.queries.rationale}</Text>
						</Box>
					</Box>
				)
			)}
		</Box>
	);
};
