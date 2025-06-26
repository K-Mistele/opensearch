import type { Reflection, SearchQueryList, SearchResult } from '@baml-client';

export type InputStep = {
	type: 'input';
	data: string;
};

export type QueriesGeneratedStep = {
	type: 'queries-generated';
	data: SearchQueryList;
};

export type SearchingStep = {
	type: 'searching';
	data: Record<string, 'pending' | 'completed'>;
};

export type SearchResultsStep = {
	type: 'search-results';
	data: Array<SearchResult>;
};

export type ReflectionStep = {
	type: 'reflection-complete';
	data: Reflection;
};

export type MaxStepsReachedStep = {
	type: 'max-steps-reached';
};

export type AnswerStep = {
	type: 'answer';
	data: string;
};

export type Step =
	| InputStep
	| QueriesGeneratedStep
	| SearchResultsStep
	| ReflectionStep
	| AnswerStep;

export interface AgentState {
	researchTopic: string;
	searchResults: Array<SearchResult>;
	steps: Array<Step>;
	state: 'start' | 'generating-queries' | Step['type'] | 'done';
	roundsLeft: number;
	answer: string | null;
}
