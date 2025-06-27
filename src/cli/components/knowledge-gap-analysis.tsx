import type { KnowledgeGapAnalysis } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

type KnowledgeGapAnalysisProps = {
	roundNumber?: number;
	queryPlan?: string[];
} & (
	| {
			isAnalyzing: true;
			relevantSourcesCount: number;
	  }
	| {
			isAnalyzing: false;
			analysis: KnowledgeGapAnalysis;
	  }
);

export const KnowledgeGapAnalysisComponent: React.FC<
	KnowledgeGapAnalysisProps
> = (props) => {
	return (
		<Box
			flexDirection="column"
			paddingX={2}
			paddingY={1}
			borderStyle="round"
			borderColor="yellow"
			marginBottom={1}
		>
			<Box marginBottom={1}>
				<Text bold color="yellow">
					🧠 Knowledge Gap Analysis
					{props.roundNumber ? ` (Round ${props.roundNumber})` : ''}
				</Text>
			</Box>

			{props.isAnalyzing ? (
				<Box flexDirection="column">
					<Text color="yellow">
						<Spinner type="dots" /> Analyzing knowledge gap history and
						persistence decisions...
					</Text>
					<Text color="gray">
						Evaluating {props.relevantSourcesCount} gaps and determining next
						research focus
					</Text>
				</Box>
			) : (
				props.analysis && (
					<Box flexDirection="column">
						{/* Research Continuation Decision */}
						<Box marginBottom={1}>
							<Text
								bold
								color={
									props.analysis.shouldContinueResearch ? 'yellow' : 'green'
								}
							>
								{props.analysis.shouldContinueResearch
									? '🔄 Continue Research - Active gaps identified'
									: '✅ Research Complete - All gaps resolved or abandoned'}
							</Text>
						</Box>

						{/* Gap Status */}
						<Box marginBottom={1} flexDirection="column">
							<Text bold color="cyan">
								Gap Status:
							</Text>
							<Text color="white">
								{props.analysis.gapStatus === 'new' &&
									'🆕 Starting new knowledge gap'}
								{props.analysis.gapStatus === 'continuing' &&
									'🔄 Continuing current knowledge gap'}
								{props.analysis.gapStatus === 'switching' &&
									'🔀 Switching to different knowledge gap'}
								{props.analysis.gapStatus === 'complete' &&
									'✅ All knowledge gaps addressed'}
							</Text>
						</Box>

						{/* Next Gap to Research */}
						{props.analysis.nextGapToResearch && (
							<Box marginBottom={1} flexDirection="column">
								<Text bold color="cyan">
									Next Research Focus:
								</Text>
								<Text color="white">{props.analysis.nextGapToResearch}</Text>
							</Box>
						)}

						{/* Gap History Summary */}
						{props.analysis.updatedGapHistory.length > 0 && (
							<Box marginBottom={1} flexDirection="column">
								<Text bold color="cyan">
									Gap History ({props.analysis.updatedGapHistory.length} total):
								</Text>
								{props.analysis.updatedGapHistory.map((gap, index) => (
									<Box
										key={`gap-${index}-${gap.description.slice(0, 15)}`}
										marginLeft={2}
										flexDirection="column"
									>
										<Text
											color={
												gap.status === 'resolved'
													? 'green'
													: gap.status === 'abandoned'
														? 'red'
														: 'yellow'
											}
										>
											{gap.status === 'resolved' && '✅'}
											{gap.status === 'abandoned' && '❌'}
											{gap.status === 'active' && '🔄'}{' '}
											{gap.description.slice(0, 60)}
											{gap.description.length > 60 ? '...' : ''} (
											{gap.attemptCount} attempts)
										</Text>
										{/* Show related questions from query plan */}
										{props.queryPlan && gap.relatedQuestionIds.length > 0 && (
											<Box marginLeft={2}>
												<Text color="gray" dimColor>
													Related questions:{' '}
													{gap.relatedQuestionIds
														.map(
															(id) =>
																props.queryPlan?.[id] || `Question ${id + 1}`,
														)
														.join(', ')}
												</Text>
											</Box>
										)}
									</Box>
								))}
							</Box>
						)}

						{/* Reasoning */}
						<Box marginBottom={1} flexDirection="column">
							<Text bold color="cyan">
								Decision Reasoning:
							</Text>
							<Text color="white">{props.analysis.reasoning}</Text>
						</Box>

						{/* Next Steps */}
						{props.analysis.shouldContinueResearch ? (
							<Box flexDirection="column">
								<Text color="yellow">
									⏭ Proceeding to generate follow-up queries...
								</Text>
							</Box>
						) : (
							<Box flexDirection="column">
								<Text color="green">
									🎯 Ready to generate final answer with available information
								</Text>
							</Box>
						)}
					</Box>
				)
			)}
		</Box>
	);
};
