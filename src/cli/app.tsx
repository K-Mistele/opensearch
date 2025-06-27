import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
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

	useEffect(() => {
		emitter.current.on('state-update', handleStateUpdate);
		emitter.current.on('state-replace', handleStateReplace);
		return () => {
			emitter.current.off('state-update', handleStateUpdate);
			emitter.current.off('state-replace', handleStateReplace);
		};
	}, []);

	const handleStateUpdate = useCallback((step: Step) => {
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

	const handleResearchTopicSubmit = useCallback((topic: string) => {
		setResearchTopic(topic);
		executeAgent({ researchTopic: topic, maxRounds: 10 });
	}, []);
	return (
		<Box flexDirection="column" overflow="visible">
			<Gradient name="atlas">
				<BigText text="Open" />
				<BigText text="Search" />
			</Gradient>
			<ResearchInput onSubmit={handleResearchTopicSubmit} />
			{steps.map((step, index) => {
				if (step.type === 'input' && index === steps.length - 1) {
					return (
						<QueryGeneration
							researchTopic={step.data}
							isGenerating={true}
							isFollowUp={false}
							key={`${step.type}-${index}`}
						/>
					);
				}
				if (step.type === 'queries-generated') {
					return (
						<QueryGeneration
							researchTopic={researchTopic}
							isGenerating={false}
							isFollowUp={false}
							queries={step.data}
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
									searchResultsLength={step.data.allSearchResults.length}
									isReflecting={true}
									key={`reflection-generating-${step.data.allSearchResults.length}`}
								/>
							)}
						</>
					);
				}
				// TODO handle if there are follow up queries
				if (
					step.type === 'reflection-complete' &&
					step.data.isSufficient &&
					index === steps.length - 1
				) {
					const lastSearchResults = steps.findLast(
						(step) => step.type === 'search-results',
					);
					return (
						<>
							<ReflectionStep
								researchTopic={researchTopic}
								isReflecting={false}
								searchResultsLength={
									lastSearchResults?.type === 'search-results'
										? lastSearchResults.data.allSearchResults.length
										: 0
								}
								reflection={step.data}
								key={`reflection-sufficient-${step.data.isSufficient ? 'yes' : 'no'}-${Date.now()}`}
							/>
							<FinalAnswer
								searchResultsLength={
									lastSearchResults?.type === 'search-results'
										? lastSearchResults.data.allSearchResults.length
										: 0
								}
								isGenerating={true}
								key={`final-answer-generating-${Date.now()}`}
							/>
						</>
					);
				}
				if (step.type === 'reflection-complete' && step.data.isSufficient) {
					const lastSearchResults = steps.findLast(
						(step) => step.type === 'search-results',
					);
					return (
						<ReflectionStep
							researchTopic={researchTopic}
							isReflecting={false}
							searchResultsLength={
								lastSearchResults?.type === 'search-results'
									? lastSearchResults.data.allSearchResults.length
									: 0
							}
							reflection={step.data}
							key={`reflection-sufficient-${step.data.isSufficient ? 'yes' : 'no'}-${Date.now()}`}
						/>
					);
				}

				// Handle reflection insufficient but max steps reached
				if (step.type === 'max-steps-reached') {
					const lastSearchResults = steps.findLast(
						(step) => step.type === 'search-results',
					);
					return (
						<>
							<Text bold color="red">
								⚠️ Maximum research rounds reached. Generating final answer with
								available information...
							</Text>
							<FinalAnswer
								searchResultsLength={
									lastSearchResults?.type === 'search-results'
										? lastSearchResults.data.allSearchResults.length
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
										? lastSearchResults.data.allSearchResults.length
										: 0
								}
								reflection={step.data}
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
									key={`follow-up-queries-${nextStep.data.query.length}`}
								/>
							)}
						</>
					);
				}

				if (step.type === 'answer') {
					return (
						<FinalAnswer
							searchResultsLength={
								steps.findLast((step) => step.type === 'search-results')!.data
									.allSearchResults.length
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
