import type {
	Query,
	Reflection,
	SearchQueryList,
	SearchResult,
} from '@baml-client';
import { Box, Static, Text } from 'ink';
import type React from 'react';
import { useState } from 'react';
import { FinalAnswer } from './components/final-answer.tsx';
import { QueryGeneration } from './components/query-generation.tsx';
import { ReflectionStep } from './components/reflection.tsx';
import { ResearchInput } from './components/research-input.tsx';
import { SearchResults } from './components/search-results.tsx';

type WorkflowStep =
	| 'input'
	| 'generating-queries'
	| 'searching'
	| 'reflecting'
	| 'generating-answer'
	| 'complete';

interface CompletedStep {
	type: 'topic' | 'queries' | 'search' | 'reflection' | 'answer';
	content: string | SearchQueryList | SearchResult[] | Reflection;
	timestamp: Date;
}

interface AppState {
	researchTopic: string;
	currentStep: WorkflowStep;
	queries: Query[];
	searchResults: SearchResult[];
	reflection: Reflection | null;
	finalAnswer: string;
	isLoading: boolean;
	iterationCount: number;
	completedSteps: CompletedStep[];
}

const App: React.FC = () => {
	const [state, setState] = useState<AppState>({
		researchTopic: '',
		currentStep: 'input',
		queries: [],
		searchResults: [],
		reflection: null,
		finalAnswer: '',
		isLoading: false,
		iterationCount: 0,
		completedSteps: [],
	});

	const addCompletedStep = (step: Omit<CompletedStep, 'timestamp'>) => {
		setState((prev) => ({
			...prev,
			completedSteps: [
				...prev.completedSteps,
				{ ...step, timestamp: new Date() },
			],
		}));
	};

	const handleResearchTopicSubmit = (topic: string) => {
		addCompletedStep({ type: 'topic', content: topic });

		setState((prev) => ({
			...prev,
			researchTopic: topic,
			currentStep: 'generating-queries',
			isLoading: true,
		}));

		// TODO: Integrate with your orchestration logic here
		// This would call your BAML functions through the orchestration system
	};

	const handleQueriesGenerated = (queryList: SearchQueryList) => {
		const queries: Query[] = queryList.query.map((q) => ({
			query: q,
			rationale: queryList.rationale,
		}));

		addCompletedStep({ type: 'queries', content: queryList });

		setState((prev) => ({
			...prev,
			queries,
			currentStep: 'searching',
		}));
	};

	const handleSearchComplete = (results: SearchResult[]) => {
		addCompletedStep({ type: 'search', content: results });

		setState((prev) => ({
			...prev,
			searchResults: results,
			currentStep: 'reflecting',
		}));
	};

	const handleReflectionComplete = (reflection: Reflection) => {
		addCompletedStep({ type: 'reflection', content: reflection });

		setState((prev) => ({
			...prev,
			reflection,
			currentStep: reflection.isSufficient
				? 'generating-answer'
				: 'generating-queries',
			iterationCount: prev.iterationCount + 1,
		}));

		if (!reflection.isSufficient && reflection.followUpQueries) {
			// Convert follow-up queries to Query format and continue the loop
			const followUpQueries: Query[] = reflection.followUpQueries.map(
				(query, index) => ({
					query,
					rationale:
						reflection.followupQueriesRationale?.[index] || 'Follow-up query',
				}),
			);

			setState((prev) => ({
				...prev,
				queries: followUpQueries,
				currentStep: 'searching',
			}));
		}
	};

	const handleAnswerGenerated = (answer: string) => {
		addCompletedStep({ type: 'answer', content: answer });

		setState((prev) => ({
			...prev,
			finalAnswer: answer,
			currentStep: 'complete',
			isLoading: false,
		}));
	};

	const renderCompletedStep = (step: CompletedStep, index: number) => {
		switch (step.type) {
			case 'topic': {
				return (
					<Box key={index} flexDirection="column" marginBottom={1}>
						<Text bold color="blue">
							🔍 Research Topic
						</Text>
						<Text>{step.content as string}</Text>
						<Text> </Text>
					</Box>
				);
			}

			case 'queries': {
				const queryList = step.content as SearchQueryList;
				return (
					<Box key={index} flexDirection="column" marginBottom={1}>
						<Text bold color="green">
							✅ Queries Generated
						</Text>
						<Text color="blue">Rationale: {queryList.rationale}</Text>
						<Text> </Text>
						{queryList.query.map((query) => (
							<Text key={query} color="cyan">
								• {query}
							</Text>
						))}
						<Text> </Text>
					</Box>
				);
			}

			case 'search': {
				const results = step.content as SearchResult[];
				return (
					<Box key={index} flexDirection="column" marginBottom={1}>
						<Text bold color="green">
							✅ Search Complete
						</Text>
						<Text>Found {results.length} search results</Text>
						<Text> </Text>
					</Box>
				);
			}

			case 'reflection': {
				const reflection = step.content as Reflection;
				return (
					<Box key={index} flexDirection="column" marginBottom={1}>
						<Text bold color={reflection.isSufficient ? 'green' : 'yellow'}>
							{reflection.isSufficient
								? '✅ Information Sufficient'
								: '⚠️  Knowledge Gaps Identified'}
						</Text>
						{!reflection.isSufficient && reflection.knowledgeGap && (
							<>
								<Text color="yellow">Gap: {reflection.knowledgeGap}</Text>
								{reflection.followUpQueries && (
									<>
										<Text>Follow-up queries:</Text>
										{reflection.followUpQueries.map((query) => (
											<Text key={query} color="cyan">
												• {query}
											</Text>
										))}
									</>
								)}
							</>
						)}
						<Text> </Text>
					</Box>
				);
			}

			case 'answer': {
				return (
					<Box key={index} flexDirection="column" marginBottom={1}>
						<Text bold color="green">
							✅ Final Answer Generated
						</Text>
						<Text>{step.content as string}</Text>
						<Text> </Text>
					</Box>
				);
			}

			default:
				return null;
		}
	};

	return (
		<>
			<Static items={state.completedSteps}>
				{(step, index) => renderCompletedStep(step, index)}
			</Static>

			<Box flexDirection="column">
				{state.currentStep === 'input' && !state.completedSteps.length && (
					<>
						<Text bold color="blue">
							🔍 Deep Research Agent
						</Text>
						<Text> </Text>
						<ResearchInput onSubmit={handleResearchTopicSubmit} />
					</>
				)}

				{state.currentStep === 'generating-queries' && (
					<QueryGeneration
						researchTopic={state.researchTopic}
						onComplete={handleQueriesGenerated}
						isFollowUp={state.iterationCount > 0}
						previousReflection={state.reflection}
					/>
				)}

				{state.currentStep === 'searching' && (
					<SearchResults
						queries={state.queries}
						onComplete={handleSearchComplete}
					/>
				)}

				{state.currentStep === 'reflecting' && (
					<ReflectionStep
						researchTopic={state.researchTopic}
						searchResults={state.searchResults}
						onComplete={handleReflectionComplete}
					/>
				)}

				{state.currentStep === 'generating-answer' && (
					<FinalAnswer
						researchTopic={state.researchTopic}
						searchResults={state.searchResults}
						onComplete={handleAnswerGenerated}
					/>
				)}

				{state.currentStep === 'complete' && (
					<Text bold color="green">
						🎉 Research Complete!
					</Text>
				)}
			</Box>
		</>
	);
};

export default App;
