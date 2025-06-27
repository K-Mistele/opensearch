import type {
	ExtractedFact,
	FollowUpQueryGeneration,
	KnowledgeGapAnalysis,
	KnowledgeGapHistory,
	Reflection,
	SearchQueryList,
	SearchResult,
} from '@baml-client';

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
	data: {
		searchResults: Array<SearchResult>;
		allSearchResults: Array<SearchResult>;
	};
};

export type ReflectionStep = {
	type: 'reflection-complete';
	data: Reflection & {
		relevantSummariesCount: number;
	};
};

export type KnowledgeGapAnalysisStep = {
	type: 'knowledge-gap-analysis';
	data: KnowledgeGapAnalysis;
};

export type FollowUpQueryGenerationStep = {
	type: 'followup-query-generation';
	data: FollowUpQueryGeneration;
};

export type SummarizationStep = {
	type: 'summarization';
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
	| SearchingStep
	| SearchResultsStep
	| ReflectionStep
	| SummarizationStep
	| KnowledgeGapAnalysisStep
	| FollowUpQueryGenerationStep
	| MaxStepsReachedStep
	| AnswerStep;

export interface AgentState {
	researchTopic: string;
	searchResults: Array<SearchResult>;
	steps: Array<Step>;
	state: 'start' | 'generating-queries' | Step['type'] | 'done';
	roundsLeft: number;
	answer: string | null;
	knowledgeGapHistory: KnowledgeGapHistory;
}
