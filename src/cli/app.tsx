import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import Link from 'ink-link';
import type { EventEmitter } from 'node:events';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { eventEmitter, executeAgent } from './agent';
import { FinalAnswer } from './components/final-answer.tsx';
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
								previousReflection={
									previousReflection?.type === 'reflection-complete'
										? previousReflection.data
										: undefined
								}
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
								key={`reflection-sufficient-${step.data.isSufficient ? 'yes' : 'no'}-${Date.now()}`}
							/>
							{/* Only show generating final answer if this is the last step and there's no answer yet */}
							{isLastStep && !hasAnswerStep && (
								<FinalAnswer
									relevantSummariesCount={step.data.relevantSummariesCount}
									isGenerating={true}
									key={`final-answer-generating-${Date.now()}`}
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
					const nextStep = index < steps.length - 1 ? steps[index + 1] : null;
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
								key={`reflection-sufficient-${step.data.isSufficient ? 'yes' : 'no'}-${Date.now()}`}
							/>
							{/* Show follow-up queries if they exist in the next step */}
							{nextStep?.type === 'queries-generated' && (
								<QueryGeneration
									researchTopic={researchTopic}
									isGenerating={false}
									isFollowUp={true}
									previousReflection={step.data}
									queries={nextStep.data}
									roundNumber={getRoundNumber(index + 1)}
									key={`follow-up-queries-${nextStep.data.query.length}`}
								/>
							)}
						</>
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
