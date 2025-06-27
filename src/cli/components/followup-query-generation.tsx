import type { FollowUpQueryGeneration } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

type FollowUpQueryGenerationProps = {
	roundNumber?: number;
	targetGap?: string;
	previousQueries?: string[];
} & (
	| {
			isGenerating: true;
	  }
	| {
			isGenerating: false;
			queryGeneration: FollowUpQueryGeneration;
	  }
);

export const FollowUpQueryGenerationComponent: React.FC<
	FollowUpQueryGenerationProps
> = (props) => {
	return (
		<Box
			flexDirection="column"
			paddingX={2}
			paddingY={1}
			borderStyle="round"
			borderColor="blue"
			marginBottom={1}
		>
			<Box marginBottom={1}>
				<Text bold color="blue">
					🎯 Follow-Up Query Generation
					{props.roundNumber ? ` (Round ${props.roundNumber})` : ''}
				</Text>
			</Box>

			{props.targetGap && (
				<Box marginBottom={1} flexDirection="column">
					<Text bold color="cyan">
						Target Knowledge Gap:
					</Text>
					<Text color="white">{props.targetGap}</Text>
				</Box>
			)}

			{props.previousQueries && props.previousQueries.length > 0 && (
				<Box marginBottom={1} flexDirection="column">
					<Text bold color="gray">
						Previous Attempts ({props.previousQueries.length}):
					</Text>
					{props.previousQueries.map((query, index) => (
						<Box
							key={`prev-query-${index}-${query.slice(0, 20)}`}
							marginLeft={2}
						>
							<Text color="gray">• {query}</Text>
						</Box>
					))}
				</Box>
			)}

			{props.isGenerating ? (
				<Box flexDirection="column">
					<Text color="blue">
						<Spinner type="dots" /> Generating diverse follow-up queries...
					</Text>
					<Text color="gray">
						Ensuring query diversity and avoiding previous patterns
					</Text>
				</Box>
			) : (
				props.queryGeneration && (
					<Box flexDirection="column">
						{/* Generated Queries */}
						<Box marginBottom={1} flexDirection="column">
							<Text bold color="blue">
								Generated Queries ({props.queryGeneration.queries.length}):
							</Text>
							{props.queryGeneration.queries.map((query, index) => (
								<Box
									key={`new-query-${index}-${query.slice(0, 20)}`}
									marginLeft={2}
									marginBottom={1}
								>
									<Text color="green">
										{index + 1}. {query}
									</Text>
								</Box>
							))}
						</Box>

						{/* Query Strategy */}
						<Box marginBottom={1} flexDirection="column">
							<Text bold color="cyan">
								Diversity Strategy:
							</Text>
							<Text color="white">{props.queryGeneration.queryStrategy}</Text>
						</Box>

						{/* Rationale */}
						<Box marginBottom={1} flexDirection="column">
							<Text bold color="cyan">
								Generation Rationale:
							</Text>
							<Text color="white">{props.queryGeneration.rationale}</Text>
						</Box>

						{/* Next Steps */}
						<Box flexDirection="column">
							<Text color="blue">🔍 Proceeding to execute web searches...</Text>
						</Box>
					</Box>
				)
			)}
		</Box>
	);
};
