import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import Link from 'ink-link';
import type { EventEmitter } from 'node:events';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { eventEmitter, executeAgent } from './agent';
import { FactExtraction } from './components/fact-extraction.tsx';
import { FinalAnswer } from './components/final-answer.tsx';
import { FollowUpQueryGenerationComponent } from './components/followup-query-generation.tsx';
import { KnowledgeGapAnalysisComponent } from './components/knowledge-gap-analysis.tsx';
import { QueryGeneration } from './components/query-generation.tsx';
import { ReflectionStep } from './components/reflection.tsx';
import { ResearchInput } from './components/research-input.tsx';
import { SearchResults } from './components/search-results.tsx';
import type { Step } from './types';

const App: React.FC = () => {
	const [steps, setSteps] = useState<Array<Step>>([]);
	const emitter = useRef<EventEmitter>(eventEmitter);
	const [researchTopic, setResearchTopic] = useState<string>('');
	const [queryPlan, setQueryPlan] = useState<string[]>([]);
	const [maxRounds] = useState<number>(10);

	// Calculate current round based on completed reflections
	const currentRound =
		steps.filter((step) => step.type === 'reflection-complete').length + 1;
	const isResearchActive =
		researchTopic &&
		!steps.some(
			(step) => step.type === 'answer' || step.type === 'max-steps-reached',
		);

	// Helper function to calculate round number for a given step index
	const getRoundNumber = (stepIndex: number): number => {
		return (
			steps
				.slice(0, stepIndex + 1)
				.filter((step) => step.type === 'reflection-complete').length + 1
		);
	};

	useEffect(() => {
		emitter.current.on('state-update', handleStateUpdate);
		emitter.current.on('state-replace', handleStateReplace);
		return () => {
			emitter.current.off('state-update', handleStateUpdate);
			emitter.current.off('state-replace', handleStateReplace);
		};
	}, []);

	const handleStateUpdate = useCallback((step: Step) => {
		if (step.type === 'queries-generated' && step.data.queryPlan) {
			setQueryPlan(step.data.queryPlan);
		}
		setSteps((prev) => [...prev, step]);
	}, []);

	const handleStateReplace = useCallback((step: Step) => {
		setSteps((prevSteps) => {
			const newSteps = [...prevSteps];
			for (let i = newSteps.length - 1; i >= 0; i--) {
				if (newSteps[i]?.type === step.type) {
					newSteps[i] = step;
					break;
				}
			}
			return newSteps;
		});
	}, []);

	const handleResearchTopicSubmit = useCallback(
		(topic: string) => {
			setResearchTopic(topic);
			setQueryPlan([]);
			executeAgent({ researchTopic: topic, maxRounds });
		},
		[maxRounds],
	);

	return (
		<Box flexDirection="column" overflow="visible">
			<Gradient name="atlas">
				<BigText text="Open" />
				<BigText text="Search" />
			</Gradient>
			<Text>
				Created by Kyle Mistele (X:{' '}
				<Link url="https://x.com/0xblacklight" fallback={false}>
					@0xblacklight
				</Link>
				, GitHub:{' '}
				<Link url="https://github.com/K-Mistele" fallback={false}>
					@K-Mistele
				</Link>
				, blog:{' '}
				<Link url="https://blacklight.sh" fallback={false}>
					blacklight.sh
				</Link>
				)
			</Text>
			<ResearchInput onSubmit={handleResearchTopicSubmit} />
			{steps.map((step, index) => {
				const roundNumber = getRoundNumber(index);

				if (step.type === 'input' && index === steps.length - 1) {
					return (
						<QueryGeneration
							researchTopic={step.data}
							isGenerating={true}
							isFollowUp={false}
							roundNumber={1}
							key={`${step.type}-${index}`}
						/>
					);
				}
				if (step.type === 'queries-generated') {
					// Determine if this is a follow-up based on previous steps
					const isFollowUpQuery = steps
						.slice(0, index)
						.some(
							(step) =>
								step.type === 'reflection-complete' && !step.data.isSufficient,
						);

					if (isFollowUpQuery) {
						// Find the previous reflection for follow-up context
						const previousReflection = steps
							.slice(0, index)
							.findLast(
								(step) =>
									step.type === 'reflection-complete' &&
									!step.data.isSufficient,
							);

						return (
							<QueryGeneration
								researchTopic={researchTopic}
								isGenerating={false}
								isFollowUp={true}
								queries={step.data}
								roundNumber={roundNumber}
								key={`${step.type}-${index}`}
							/>
						);
					}

					return (
						<QueryGeneration
							researchTopic={researchTopic}
							isGenerating={false}
							isFollowUp={false}
							queries={step.data}
							roundNumber={roundNumber}
							key={`${step.type}-${index}`}
						/>
					);
				}
				if (step.type === 'searching') {
					if (index === steps.length - 1)
						return (
							<SearchResults
								queries={step.data}
								isSearching={true}
								searchResults={[]}
								key={`${step.type}-${index}`}
							/>
						);
				}
				if (step.type === 'search-results') {
					const prevStep = steps[index - 1];
					const hasReflectionComplete = steps
						.slice(index + 1)
						.some((s) => s.type === 'reflection-complete');
					const isLastStep = index === steps.length - 1;

					return (
						<>
							<SearchResults
								queries={prevStep?.type === 'searching' ? prevStep.data : {}}
								isSearching={false}
								searchResults={step.data.searchResults}
								key={`search-results-${step.data.searchResults.length}`}
							/>
							{!hasReflectionComplete && isLastStep && (
								<ReflectionStep
									researchTopic={researchTopic}
									searchResultsLength={step.data.searchResults.length}
									isReflecting={true}
									key={`reflection-generating-${step.data.searchResults.length}`}
									queryPlan={queryPlan}
									roundNumber={roundNumber}
								/>
							)}
						</>
					);
				}
				// Handle reflection complete and sufficient
				if (step.type === 'reflection-complete' && step.data.isSufficient) {
					const lastSearchResults = steps.findLast(
						(step) => step.type === 'search-results',
					);
					const isLastStep = index === steps.length - 1;
					const hasAnswerStep = steps.some((s) => s.type === 'answer');
					const hasSummarizationStep = steps
						.slice(index + 1)
						.some((s) => s.type === 'summarization');

					return (
						<>
							<ReflectionStep
								researchTopic={researchTopic}
								isReflecting={false}
								searchResultsLength={
									lastSearchResults?.type === 'search-results'
										? lastSearchResults.data.searchResults.length
										: 0
								}
								reflection={step.data}
								queryPlan={queryPlan}
								roundNumber={roundNumber}
								key={`reflection-sufficient-${index}-${roundNumber}`}
							/>
							{/* Show fact extraction if no summarization step exists yet and this is the last step */}
							{!hasSummarizationStep &&
								isLastStep &&
								step.data.relevantSummariesCount > 0 && (
									<FactExtraction
										isExtracting={true}
										relevantSourcesCount={step.data.relevantSummariesCount}
										roundNumber={roundNumber}
										key={`fact-extraction-generating-${index}-${roundNumber}`}
									/>
								)}
							{/* Only show generating final answer if this is the last step, there's no answer yet, and no pending summarization */}
							{isLastStep &&
								!hasAnswerStep &&
								!hasSummarizationStep &&
								step.data.relevantSummariesCount === 0 && (
									<FinalAnswer
										relevantSummariesCount={step.data.relevantSummariesCount}
										isGenerating={true}
										key={`final-answer-generating-${index}-${roundNumber}`}
									/>
								)}
						</>
					);
				}

				// Handle summarization step
				if (step.type === 'summarization') {
					const isLastStep = index === steps.length - 1;
					const hasAnswerStep = steps.some((s) => s.type === 'answer');

					// Check if knowledge gap analysis is still in progress
					// Find the most recent insufficient reflection that would have triggered concurrent operations
					const lastInsufficientReflection = steps
						.slice(0, index)
						.findLast(
							(s) => s.type === 'reflection-complete' && !s.data.isSufficient,
						);

					const hasKnowledgeGapAnalysisAfterReflection =
						lastInsufficientReflection
							? steps
									.slice(steps.indexOf(lastInsufficientReflection) + 1)
									.some((s) => s.type === 'knowledge-gap-analysis')
							: false;

					// Only show final answer if both fact extraction is complete AND knowledge gap analysis is complete
					// (or there was no insufficient reflection that would trigger knowledge gap analysis)
					const shouldShowFinalAnswer =
						!step.isExtracting &&
						isLastStep &&
						!hasAnswerStep &&
						(!lastInsufficientReflection ||
							hasKnowledgeGapAnalysisAfterReflection);

					return (
						<>
							{step.isExtracting ? (
								<FactExtraction
									isExtracting={true}
									relevantSourcesCount={step.relevantSourcesCount}
									roundNumber={roundNumber}
									key={`fact-extraction-generating-${index}-${roundNumber}`}
								/>
							) : (
								<FactExtraction
									isExtracting={false}
									extractedFacts={step.extractedFacts}
									roundNumber={roundNumber}
									key={`fact-extraction-complete-${index}-${roundNumber}`}
								/>
							)}
							{/* Show generating final answer only if fact extraction is complete, this is the last step, no answer yet, AND knowledge gap analysis is complete */}
							{shouldShowFinalAnswer && (
								<FinalAnswer
									relevantSummariesCount={step.extractedFacts.length}
									isGenerating={true}
									key={`final-answer-generating-after-extraction-${index}-${roundNumber}`}
								/>
							)}
						</>
					);
				}

				// Handle reflection insufficient but max steps reached
				if (step.type === 'max-steps-reached') {
					// For max steps reached, we need to get the relevant summaries count from the last reflection
					const lastReflection = steps.findLast(
						(step) => step.type === 'reflection-complete',
					);
					return (
						<>
							<Text bold color="red">
								⚠️ Maximum research rounds reached. Generating final answer with
								available information...
							</Text>
							<FinalAnswer
								relevantSummariesCount={
									lastReflection?.type === 'reflection-complete'
										? lastReflection.data.relevantSummariesCount
										: 0
								}
								isGenerating={true}
							/>
						</>
					);
				}

				// Handle reflection insufficient - show follow-up queries
				if (step.type === 'reflection-complete' && !step.data.isSufficient) {
					const lastSearchResults = steps.findLast(
						(step) => step.type === 'search-results',
					);
					const isLastStep = index === steps.length - 1;
					const hasKnowledgeGapAnalysis = steps
						.slice(index + 1)
						.some((s) => s.type === 'knowledge-gap-analysis');
					const hasSummarizationStep = steps
						.slice(index + 1)
						.some((s) => s.type === 'summarization');

					return (
						<>
							<ReflectionStep
								researchTopic={researchTopic}
								isReflecting={false}
								searchResultsLength={
									lastSearchResults?.type === 'search-results'
										? lastSearchResults.data.searchResults.length
										: 0
								}
								reflection={step.data}
								queryPlan={queryPlan}
								roundNumber={roundNumber}
								key={`reflection-insufficient-${index}-${roundNumber}`}
							/>
							{/* Show concurrent processing if this is the last step and no concurrent steps exist yet */}
							{isLastStep && !hasKnowledgeGapAnalysis && (
								<KnowledgeGapAnalysisComponent
									isAnalyzing={true}
									relevantSourcesCount={step.data.relevantSummariesCount || 0}
									roundNumber={roundNumber}
									queryPlan={queryPlan}
									key={`knowledge-gap-analysis-generating-${index}-${roundNumber}`}
								/>
							)}
							{/* Show fact extraction if no summarization step exists yet and this is the last step */}
							{isLastStep &&
								!hasSummarizationStep &&
								step.data.relevantSummariesCount > 0 && (
									<FactExtraction
										isExtracting={true}
										relevantSourcesCount={step.data.relevantSummariesCount}
										roundNumber={roundNumber}
										key={`fact-extraction-generating-concurrent-${index}-${roundNumber}`}
									/>
								)}
						</>
					);
				}

				// Handle knowledge gap analysis step
				if (step.type === 'knowledge-gap-analysis') {
					const isLastStep = index === steps.length - 1;
					const hasFollowUpStep = steps
						.slice(index + 1)
						.some((s) => s.type === 'followup-query-generation');

					return (
						<>
							<KnowledgeGapAnalysisComponent
								isAnalyzing={false}
								analysis={step.data}
								roundNumber={roundNumber}
								queryPlan={queryPlan}
								key={`knowledge-gap-analysis-${index}-${roundNumber}`}
							/>
							{/* Show generating follow-up queries if this is the last step and we should continue research */}
							{!hasFollowUpStep &&
								isLastStep &&
								step.data.shouldContinueResearch && (
									<FollowUpQueryGenerationComponent
										isGenerating={true}
										roundNumber={roundNumber}
										targetGap={step.data.nextGapToResearch || undefined}
										previousQueries={
											step.data.updatedGapHistory.find(
												(gap) =>
													gap.description === step.data.nextGapToResearch,
											)?.previousQueries || []
										}
										key={`followup-generating-${index}-${roundNumber}`}
									/>
								)}
						</>
					);
				}

				// Handle follow-up query generation step
				if (step.type === 'followup-query-generation') {
					// Find the previous knowledge gap analysis to get previous queries
					const previousGapAnalysis = steps
						.slice(0, index)
						.findLast((s) => s.type === 'knowledge-gap-analysis');

					// Get previous queries for the target gap
					let previousQueries: string[] = [];
					if (previousGapAnalysis?.type === 'knowledge-gap-analysis') {
						const targetGap = previousGapAnalysis.data.nextGapToResearch;
						const matchingGap = previousGapAnalysis.data.updatedGapHistory.find(
							(gap) => gap.description === targetGap,
						);
						previousQueries = matchingGap?.previousQueries || [];
					}

					return (
						<FollowUpQueryGenerationComponent
							isGenerating={false}
							queryGeneration={step.data}
							roundNumber={roundNumber}
							previousQueries={previousQueries}
							key={`followup-complete-${index}-${roundNumber}`}
						/>
					);
				}

				if (step.type === 'answer') {
					// For final answer, get the relevant summaries count from the last reflection
					const lastReflection = steps.findLast(
						(step) => step.type === 'reflection-complete',
					);
					return (
						<FinalAnswer
							relevantSummariesCount={
								lastReflection?.type === 'reflection-complete'
									? lastReflection.data.relevantSummariesCount
									: 0
							}
							isGenerating={false}
							answer={step.data}
							key={`${step.type}-${index}`}
						/>
					);
				}
			})}
		</Box>
	);
};

export default App;
