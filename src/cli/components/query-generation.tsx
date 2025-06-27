import type { Reflection, SearchQueryList } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

type QueryGenerationProps = {
	researchTopic: string;
	roundNumber?: number;
} & (
	| {
			isFollowUp: true;
			previousReflection?: Reflection;
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
	const {
		researchTopic,
		isFollowUp = false,
		isGenerating,
		roundNumber,
	} = props;

	const genWord = props.isGenerating ? 'Generating' : 'Generated';

	return (
		<Box
			flexDirection="column"
			borderColor="blue"
			borderStyle="round"
			paddingX={2}
			paddingY={1}
			marginBottom={1}
		>
			<Box marginBottom={1}>
				<Text bold color="blue">
					{isFollowUp
						? `🔄 Follow-Up Query Generation${roundNumber ? ` (Round ${roundNumber})` : ''}`
						: `🤖 Search Query Generation${roundNumber ? ` (Round ${roundNumber})` : ''}`}
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="gray">Topic: {researchTopic}</Text>
			</Box>

			{isFollowUp &&
				'previousReflection' in props &&
				props.previousReflection?.knowledgeGap && (
					<Box marginBottom={1}>
						<Text color="yellow">
							Gap: {props.previousReflection.knowledgeGap}
						</Text>
					</Box>
				)}

			{isGenerating ? (
				<Box marginBottom={1}>
					<Text color="blue">
						<Spinner type="dots" /> Analyzing topic and crafting optimal search
						queries...
					</Text>
				</Box>
			) : (
				'queries' in props &&
				props.queries && (
					<Box flexDirection="column">
						<Box marginBottom={1}>
							<Text bold color="green">
								✓ Queries Ready
							</Text>
						</Box>

						<Box marginBottom={1} flexDirection="column">
							<Text bold color="white">
								Search Queries:
							</Text>
							{props.queries.query.map((query: string) => (
								<Text key={query} color="cyan">
									• {query}
								</Text>
							))}
						</Box>

						<Box flexDirection="column" marginBottom={1}>
							<Text bold color="white">
								Rationale:
							</Text>
							<Text color="gray">{props.queries.rationale}</Text>
						</Box>

						<Box flexDirection="column">
							<Text bold color="white">
								Query Plan (Questions to Answer):
							</Text>
							{props.queries.queryPlan.map((question: string) => (
								<Text key={question} color="magenta">
									• {question}
								</Text>
							))}
						</Box>
					</Box>
				)
			)}
		</Box>
	);
};
