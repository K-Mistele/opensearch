import { Text } from 'ink';
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
		<>
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
					return (
						<>
							<SearchResults
								queries={
									steps[index - 1]!.data as Record<
										string,
										'pending' | 'completed'
									>
								}
								isSearching={false}
								searchResults={step.data.searchResults}
								key={`${step.type}-${index}`}
							/>
							<ReflectionStep
								researchTopic={researchTopic}
								searchResultsLength={step.data.allSearchResults.length}
								isReflecting={true}
								key={`${step.type}-${index}`}
							/>
						</>
					);
				}
				// TODO handle if there are follow up queries
				if (
					step.type === 'reflection-complete' &&
					step.data.isSufficient &&
					index === steps.length - 1
				) {
					return (
						<>
							<ReflectionStep
								researchTopic={researchTopic}
								isReflecting={false}
								searchResultsLength={
									steps.findLast((step) => step.type === 'search-results')!.data
										.allSearchResults.length
								}
								reflection={step.data}
								key={`${step.type}-${index}`}
							/>
							<FinalAnswer
								searchResultsLength={
									steps.findLast((step) => step.type === 'search-results')!.data
										.allSearchResults.length
								}
								isGenerating={true}
							/>
						</>
					);
				}
				if (step.type === 'reflection-complete' && step.data.isSufficient) {
					<ReflectionStep
						researchTopic={researchTopic}
						isReflecting={false}
						searchResultsLength={
							steps.findLast((step) => step.type === 'search-results')!.data
								.allSearchResults.length
						}
						reflection={step.data}
						key={`${step.type}-${index}`}
					/>;
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
			<Text>{steps.length}</Text>
			{steps.map((step, index) => (
				<Text key={`${step.type}-${index}`}>{step.type}</Text>
			))}
		</>
	);
};

export default App;
