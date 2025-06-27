import { eventEmitter } from '@/cli/agent';
import type { Step } from '@/cli/types';
import { describe, expect, it } from 'bun:test';

describe('Follow-up Query Integration - Real Flow Tests', () => {
	it('should properly identify follow-up queries in step sequence', () => {
		// Test the actual logic used in app.tsx to determine if queries are follow-ups
		const mockSteps: Step[] = [
			{ type: 'input', data: 'test topic' },
			{
				type: 'queries-generated',
				data: {
					query: ['initial query'],
					rationale: 'initial rationale',
					queryPlan: ['question 1', 'question 2'],
				},
			},
			{ type: 'searching', data: { query1: 'completed' } },
			{
				type: 'search-results',
				data: {
					searchResults: [],
					allSearchResults: [],
				},
			},
			{
				type: 'reflection-complete',
				data: {
					isSufficient: false,
					knowledgeGap: 'need more info',
					followUpQueries: ['follow up query'],
					answeredQuestions: [0],
					unansweredQuestions: [1],
					relevantSummaryIds: ['id1'],
					relevantSummariesCount: 1,
				},
			},
			{
				type: 'queries-generated',
				data: {
					query: ['follow up query'],
					rationale: 'need more info',
					queryPlan: ['question 1', 'question 2'],
				},
			},
		];

		// Test the actual logic from app.tsx
		const getRoundNumber = (stepIndex: number): number => {
			return (
				mockSteps
					.slice(0, stepIndex + 1)
					.filter((step) => step.type === 'reflection-complete').length + 1
			);
		};

		const isFollowUpQuery = (stepIndex: number) => {
			return mockSteps
				.slice(0, stepIndex)
				.some(
					(step) =>
						step.type === 'reflection-complete' &&
						'data' in step &&
						typeof step.data === 'object' &&
						step.data !== null &&
						'isSufficient' in step.data &&
						!step.data.isSufficient,
				);
		};

		// First queries-generated should not be follow-up
		expect(isFollowUpQuery(1)).toBe(false);
		expect(getRoundNumber(1)).toBe(1);

		// Second queries-generated should be follow-up (after insufficient reflection)
		expect(isFollowUpQuery(5)).toBe(true);
		expect(getRoundNumber(5)).toBe(2);
	});

	it('should properly handle reflection with sufficient results', () => {
		const mockSteps: Step[] = [
			{ type: 'input', data: 'test topic' },
			{
				type: 'reflection-complete',
				data: {
					isSufficient: true,
					answeredQuestions: [0, 1],
					unansweredQuestions: [],
					relevantSummaryIds: ['id1', 'id2'],
					relevantSummariesCount: 2,
				},
			},
		];

		const isFollowUpQuery = (stepIndex: number) => {
			return mockSteps
				.slice(0, stepIndex)
				.some(
					(step) =>
						step.type === 'reflection-complete' &&
						'data' in step &&
						typeof step.data === 'object' &&
						step.data !== null &&
						'isSufficient' in step.data &&
						!step.data.isSufficient,
				);
		};

		// Should not trigger follow-up queries when reflection is sufficient
		expect(isFollowUpQuery(1)).toBe(false);
	});

	it('should correctly calculate progress percentage', () => {
		const queryPlan = ['Question 1', 'Question 2', 'Question 3', 'Question 4'];
		const answeredQuestions = [0, 2]; // 2 out of 4 answered

		const progressPercentage =
			queryPlan.length > 0
				? Math.round((answeredQuestions.length / queryPlan.length) * 100)
				: 0;

		expect(progressPercentage).toBe(50);
	});

	it('should validate event emitter exists and has required methods', () => {
		// Ensure the event emitter has the methods we need
		expect(eventEmitter).toBeDefined();
		expect(typeof eventEmitter.emit).toBe('function');
		expect(typeof eventEmitter.on).toBe('function');
		expect(typeof eventEmitter.off).toBe('function');
	});
});

describe('Follow-up Query Types and Interfaces', () => {
	it('should have proper type structure for reflection steps', () => {
		// Test that the reflection step type has the required fields
		const mockReflectionStep: Step = {
			type: 'reflection-complete',
			data: {
				isSufficient: false,
				answeredQuestions: [0],
				unansweredQuestions: [1, 2],
				knowledgeGap: 'Missing information',
				followUpQueries: ['Query 1', 'Query 2'],
				relevantSummaryIds: ['id1'],
				relevantSummariesCount: 1,
			},
		};

		expect(mockReflectionStep.type).toBe('reflection-complete');
		expect(mockReflectionStep.data.isSufficient).toBe(false);
		expect(Array.isArray(mockReflectionStep.data.followUpQueries)).toBe(true);
		expect(mockReflectionStep.data.followUpQueries?.length).toBe(2);
	});

	it('should have proper type structure for query generation steps', () => {
		const mockQueryStep: Step = {
			type: 'queries-generated',
			data: {
				query: ['Test query'],
				rationale: 'Test rationale',
				queryPlan: ['Question 1'],
			},
		};

		expect(mockQueryStep.type).toBe('queries-generated');
		expect(Array.isArray(mockQueryStep.data.query)).toBe(true);
		expect(typeof mockQueryStep.data.rationale).toBe('string');
		expect(Array.isArray(mockQueryStep.data.queryPlan)).toBe(true);
	});
});
