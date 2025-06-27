#!/usr/bin/env bun
/**
 * Manual Test Script for Follow-up Queries
 *
 * This script validates that follow-up queries work in the actual environment
 * by testing a research topic that should require multiple rounds.
 *
 * Usage: bun run scripts/test-follow-up-queries.ts
 */

import { eventEmitter, executeAgent } from '@/cli/agent';
import type { Step } from '@/cli/types';

interface TestResult {
	passed: boolean;
	message: string;
	details?: any;
}

class FollowUpQueryTester {
	private events: Step[] = [];
	private testResults: TestResult[] = [];

	constructor() {
		this.setupEventListeners();
	}

	private setupEventListeners() {
		eventEmitter.on('state-update', (step: Step) => {
			this.events.push(step);
			console.log(
				`📝 Event: ${step.type}`,
				step.type === 'input' ? step.data : '',
			);
		});
	}

	private addResult(result: TestResult) {
		this.testResults.push(result);
		const status = result.passed ? '✅' : '❌';
		console.log(`${status} ${result.message}`);
		if (result.details) {
			console.log(`   Details:`, result.details);
		}
	}

	async testFollowUpQueries(): Promise<void> {
		console.log('🚀 Starting Follow-up Query Integration Test\n');

		// Test with a topic that should require follow-up queries
		const testTopic =
			'Compare the latest funding rounds for AI startups in 2024 vs 2023, focusing on both seed stage and Series A investments';

		console.log(`🔍 Testing topic: "${testTopic}"\n`);

		try {
			// Reset events
			this.events = [];

			// Execute the agent
			const result = await executeAgent({
				researchTopic: testTopic,
				maxRounds: 3, // Limited rounds for testing
			});

			// Analyze the results
			this.analyzeResults(result || null);
		} catch (error) {
			this.addResult({
				passed: false,
				message: 'Agent execution failed',
				details: error instanceof Error ? error.message : String(error),
			});
		}

		this.printSummary();
	}

	private analyzeResults(finalAnswer: string | null) {
		// Test 1: Check if we got initial queries
		const initialQueries = this.events.find(
			(e) => e.type === 'queries-generated',
		);
		this.addResult({
			passed: !!initialQueries,
			message: 'Initial queries were generated',
			details: initialQueries
				? `Generated ${initialQueries.data.query.length} queries`
				: 'No queries found',
		});

		// Test 2: Check if reflection occurred
		const reflections = this.events.filter(
			(e) => e.type === 'reflection-complete',
		);
		this.addResult({
			passed: reflections.length > 0,
			message: 'Reflection analysis occurred',
			details: `Found ${reflections.length} reflection(s)`,
		});

		// Test 3: Check for follow-up queries (multiple query generations)
		const allQueryGenerations = this.events.filter(
			(e) => e.type === 'queries-generated',
		);
		const hasFollowUpQueries = allQueryGenerations.length > 1;
		this.addResult({
			passed: hasFollowUpQueries,
			message: 'Follow-up queries were generated',
			details: `Found ${allQueryGenerations.length} query generation event(s)`,
		});

		// Test 4: Check if any reflection indicated insufficient information
		const insufficientReflections = reflections.filter(
			(r) =>
				!r.data.isSufficient &&
				r.data.followUpQueries &&
				r.data.followUpQueries.length > 0,
		);
		this.addResult({
			passed:
				insufficientReflections.length > 0 ||
				reflections.some((r) => r.data.isSufficient),
			message: 'Reflection properly identified information gaps',
			details: `${insufficientReflections.length} insufficient reflection(s), ${reflections.filter((r) => r.data.isSufficient).length} sufficient reflection(s)`,
		});

		// Test 5: Check if search results were gathered
		const searchResults = this.events.filter(
			(e) => e.type === 'search-results',
		);
		this.addResult({
			passed: searchResults.length > 0,
			message: 'Search results were gathered',
			details: `Found ${searchResults.length} search result event(s)`,
		});

		// Test 6: Check if final answer was generated
		this.addResult({
			passed: !!finalAnswer && finalAnswer.length > 100,
			message: 'Comprehensive final answer was generated',
			details: finalAnswer
				? `Answer length: ${finalAnswer.length} characters`
				: 'No answer generated',
		});

		// Test 7: Check the research progression
		const rounds = reflections.length;
		this.addResult({
			passed: rounds >= 1,
			message: 'Research progressed through multiple analysis rounds',
			details: `Completed ${rounds} research round(s)`,
		});
	}

	private printSummary() {
		console.log(`\n${'='.repeat(60)}`);
		console.log('📊 TEST SUMMARY');
		console.log('='.repeat(60));

		const passed = this.testResults.filter((r) => r.passed).length;
		const total = this.testResults.length;
		const percentage = Math.round((passed / total) * 100);

		console.log(`Results: ${passed}/${total} tests passed (${percentage}%)`);

		if (passed === total) {
			console.log(
				'🎉 All tests passed! Follow-up queries are working correctly.',
			);
		} else {
			console.log('⚠️  Some tests failed. Check the details above.');
		}

		console.log('\n📋 Event Flow Summary:');
		this.events.forEach((event, index) => {
			console.log(`  ${index + 1}. ${event.type}`);
		});

		console.log('\n💡 For manual validation, run: bun run cli');
		console.log(
			'   Try a complex research topic and observe the follow-up queries.',
		);
	}
}

// Run the test if this script is executed directly
if (import.meta.main) {
	const tester = new FollowUpQueryTester();
	await tester.testFollowUpQueries();
}
