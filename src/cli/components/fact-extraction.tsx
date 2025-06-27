import type { ExtractedFact } from '@baml-client';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type React from 'react';

type FactExtractionProps = {
	roundNumber?: number;
} & (
	| {
			isExtracting: true;
			relevantSourcesCount: number;
	  }
	| {
			isExtracting: false;
			extractedFacts: Array<ExtractedFact>;
	  }
);

export const FactExtraction: React.FC<FactExtractionProps> = (props) => {
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
					📑 Fact Extraction
					{props.roundNumber ? ` (Round ${props.roundNumber})` : ''}
				</Text>
			</Box>

			{props.isExtracting ? (
				<>
					<Box marginBottom={1}>
						<Text color="gray">
							Extracting relevant facts from {props.relevantSourcesCount}{' '}
							sources...
						</Text>
					</Box>
					<Box marginBottom={1}>
						<Text color="blue">
							<Spinner type="dots" /> Distilling key information to reduce
							context length...
						</Text>
					</Box>
				</>
			) : (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text bold color="green">
							✓ Fact Extraction Complete
						</Text>
					</Box>

					<Box marginBottom={1}>
						<Text color="gray">
							Extracted {props.extractedFacts.length} concise fact set(s) from
							relevant sources
						</Text>
					</Box>

					{props.extractedFacts.length > 0 && (
						<Box marginBottom={1} flexDirection="column">
							<Text bold color="cyan">
								Sources Processed:
							</Text>
							{props.extractedFacts.map((fact, index) => (
								<Text key={fact.sourceId || index} color="cyan">
									• Source {fact.sourceId} ({fact.relevantFacts.length} facts)
								</Text>
							))}
						</Box>
					)}

					<Box flexDirection="column">
						<Text color="green">✓ Ready to proceed with optimized context</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
};
