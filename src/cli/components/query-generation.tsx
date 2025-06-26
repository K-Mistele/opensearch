import type { Reflection, SearchQueryList } from "@baml-client";
import { b } from "@baml-client";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type React from "react";
import { useEffect, useState } from "react";

interface QueryGenerationProps {
	researchTopic: string;
	onComplete: (queryList: SearchQueryList) => void;
	isFollowUp?: boolean;
	previousReflection?: Reflection | null;
}

export const QueryGeneration: React.FC<QueryGenerationProps> = ({
	researchTopic,
	onComplete,
	isFollowUp = false,
	previousReflection,
}) => {
	const [isGenerating, setIsGenerating] = useState(true);
	const [generatedQueries, setGeneratedQueries] =
		useState<SearchQueryList | null>(null);

	useEffect(() => {
		const generateQueries = async () => {
			setIsGenerating(true);

			try {
				// Call actual BAML GenerateQuery function
				const args = {
					research_topic: researchTopic,
					current_date: new Date().toISOString().substring(0, 10), // Format as YYYY-MM-DD
					...(isFollowUp && { number_queries: 2 }),
				};

				const result = await b.GenerateQuery(args);

				setGeneratedQueries(result);
				setIsGenerating(false);
				onComplete(result);
			} catch (error) {
				console.error("Error generating queries:", error);

				// Fallback to mock data on error
				const mockQueries: SearchQueryList = {
					query:
						isFollowUp && previousReflection?.followUpQueries
							? previousReflection.followUpQueries
							: [
									`${researchTopic} latest news 2024`,
									`${researchTopic} recent developments`,
								],
					rationale: isFollowUp
						? `Following up on knowledge gaps: ${previousReflection?.knowledgeGap}`
						: `Initial research queries for understanding ${researchTopic}`,
				};

				setGeneratedQueries(mockQueries);
				setIsGenerating(false);
				onComplete(mockQueries);
			}
		};

		generateQueries();
	}, [researchTopic, onComplete, isFollowUp, previousReflection]);

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="yellow">
					{isFollowUp
						? "🔄 Generating Follow-up Queries"
						: "🤖 Generating Search Queries"}
				</Text>
			</Box>

			{isFollowUp && previousReflection?.knowledgeGap && (
				<Box marginBottom={1} paddingLeft={2}>
					<Text color="gray">
						Knowledge Gap: {previousReflection.knowledgeGap}
					</Text>
				</Box>
			)}

			<Box marginBottom={1} paddingLeft={2}>
				<Text color="gray">Research Topic: {researchTopic}</Text>
			</Box>

			{isGenerating ? (
				<Box>
					<Spinner type="dots" />
					<Text>
						{" "}
						Analyzing topic and generating optimized search queries...
					</Text>
				</Box>
			) : (
				generatedQueries && (
					<Box flexDirection="column" marginTop={1}>
						<Box marginBottom={1}>
							<Text bold color="green">
								✅ Queries Generated
							</Text>
						</Box>

						<Box marginBottom={1} paddingLeft={2}>
							<Text color="blue">Rationale: {generatedQueries.rationale}</Text>
						</Box>

						<Box flexDirection="column" paddingLeft={2}>
							<Text bold>Search Queries:</Text>
							{generatedQueries.query.map((query) => (
								<Box key={query} marginTop={1}>
									<Text color="cyan">• {query}</Text>
								</Box>
							))}
						</Box>
					</Box>
				)
			)}
		</Box>
	);
};
