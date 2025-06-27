# OpenSearch Knowledge Gap History Tracking Implementation Plan

## Problem Statement
The agent gets stuck in infinite loops when trying to research information that doesn't exist (e.g., "Naptha AI's fundraising round valuation"). The current reflection step doesn't track previously attempted knowledge gaps, leading to repeated attempts at solving the same unanswerable questions.

## Current vs. Proposed Architecture

### Current Single-Step Approach
```
Reflect → [Analyze + Track + Identify + Determine Gaps + Generate Queries]
```

### New Multi-Step Approach  
```
1. Reflect → [Analyze results + Track query plan + Identify sources + Gap closure assessment]
2. Extract Facts (concurrent) → [Already implemented - extract from relevant sources]
3. Knowledge Gap Analysis (concurrent) → [NEW - Gap history + Persistence decisions + Next gap selection]
4. Follow-up Query Generation → [NEW - Generate diverse queries for chosen gap]
```

---

## Implementation Plan

### Phase 1: Data Models & Type Definitions
- [ ] **1.1** Add knowledge gap tracking types to `baml_src/types.baml`
  ```typescript
  class AttemptedKnowledgeGap {
      description string @description("Description of the knowledge gap")
      attemptCount int @description("Number of rounds spent trying to solve this gap")
      status "active" | "abandoned" | "resolved" @description("Current status of this knowledge gap")
      previousQueries string[] @description("All queries previously tried for this gap")
      relatedQuestionIds int[] @description("Query plan question IDs this gap addresses")
      firstAttemptedRound int @description("Round when this gap was first identified")
      lastAttemptedRound int @description("Most recent round when this gap was attempted")
  }

  class KnowledgeGapHistory {
      gaps AttemptedKnowledgeGap[] @description("History of all knowledge gaps attempted")
      currentGapIndex int? @description("Index of the currently active knowledge gap (-1 if none)")
  }
  ```

- [ ] **1.2** Update `Reflection` type to focus on gap closure assessment
  ```typescript
  class Reflection {
      isSufficient bool @description("Whether research is complete overall")
      answeredQuestions int[] @description("Query plan questions answered this round")
      unansweredQuestions int[] @description("Query plan questions still unanswered")
      relevantSummaryIds string[] @description("Sources with relevant information")
      currentGapClosed bool @description("Whether the knowledge gap we were trying to close this round was successfully closed")
      newGapsIdentified string[]? @description("Any new knowledge gaps discovered this round")
  }
  ```

- [ ] **1.3** Add new BAML function types
  ```typescript
  class KnowledgeGapAnalysis {
      shouldContinueResearch bool @description("Whether to continue research or generate final answer")
      nextGapToResearch string? @description("Description of the next knowledge gap to focus on")
      gapStatus "new" | "continuing" | "switching" | "complete" @description("What we're doing with knowledge gaps")
      reasoning string @description("Explanation of the decision")
      updatedGapHistory AttemptedKnowledgeGap[] @description("Updated status of all attempted gaps")
  }

  class FollowUpQueryGeneration {
      queries string[] @description("Follow-up search queries for the current knowledge gap")
      rationale string @description("Explanation of why these queries will help close the gap")
      queryStrategy string @description("Strategy used to ensure query diversity")
  }
  ```

### Phase 2: BAML Function Implementation
- [ ] **2.1** Update `baml_src/reflect.baml` to focus on gap closure assessment
  - Remove follow-up query generation logic
  - Focus on analyzing whether current knowledge gap was closed
  - Identify any new knowledge gaps discovered
  - Maintain question tracking and source identification

- [ ] **2.2** Create `baml_src/analyze_knowledge_gaps.baml`
  - Input: current gap history, reflection results, query plan, current round
  - Analyze each gap's attempt history and success/failure
  - Implement abandonment logic (3 rounds OR thorough research)
  - Select next gap to research based on priority and feasibility
  - Update gap statuses and attempt counts

- [ ] **2.3** Create `baml_src/generate_followup_queries.baml`  
  - Input: selected knowledge gap, previous queries for that gap, reflection results
  - Generate diverse queries that avoid repeating previous attempts
  - Ensure queries target the specific knowledge gap effectively
  - Provide rationale for query strategy and diversity approach

### Phase 3: CLI Agent Updates (`src/cli/agent.ts`)
- [ ] **3.1** Add knowledge gap tracking state
  ```typescript
  const state: AgentState = {
      // ... existing fields
      knowledgeGapHistory: { gaps: [], currentGapIndex: -1 },
  }
  ```

- [ ] **3.2** Update reflection step to focus on gap closure
  ```typescript
  const reflection = await b.Reflect(
      searchResults,
      researchTopic, 
      initialQueries.queryPlan,
      answeredQuestions,
      unansweredQuestions,
      currentGap // Current knowledge gap being researched
  );
  ```

- [ ] **3.3** Implement concurrent knowledge gap analysis and fact extraction
  ```typescript
  // After reflection, run these concurrently
  const [gapAnalysis, extractedFacts] = await Promise.all([
      // Knowledge gap analysis
      reflection.isSufficient ? null : b.AnalyzeKnowledgeGaps(
          state.knowledgeGapHistory,
          reflection,
          initialQueries.queryPlan,
          currentRound
      ),
      // Fact extraction (existing logic)
      reflection.relevantSummaryIds.length > 0 ? 
          extractFactsFromSources(relevantSources) : null
  ]);
  ```

- [ ] **3.4** Add follow-up query generation step
  ```typescript
  if (gapAnalysis?.shouldContinueResearch) {
      const followUpQueries = await b.GenerateFollowUpQueries(
          gapAnalysis.nextGapToResearch,
          getPreviousQueriesForGap(gapAnalysis.nextGapToResearch),
          reflection
      );
      queries = followUpQueries.queries;
  }
  ```

- [ ] **3.5** Update event emission for new steps
  - Add `knowledge-gap-analysis` step type
  - Add `followup-query-generation` step type  
  - Update UI flow to show concurrent processing

### Phase 4: Inngest Workflow Updates (`src/inngest/functions/deep-research.ts`)
- [ ] **4.1** Add knowledge gap history tracking to workflow state
- [ ] **4.2** Update reflection step to focus on gap closure assessment
- [ ] **4.3** Implement concurrent step execution for gap analysis and fact extraction
- [ ] **4.4** Add follow-up query generation as separate step
- [ ] **4.5** Update logging and channel publishing for new steps

### Phase 5: UI Components (`src/cli/components/`)
- [ ] **5.1** Update `reflection.tsx` to show gap closure assessment
  - Display whether current gap was closed
  - Show any new gaps identified
  - Remove follow-up query preview (moved to separate component)

- [ ] **5.2** Create `knowledge-gap-analysis.tsx`
  - Show gap history and status of each attempted gap
  - Display abandonment decisions and reasoning
  - Show next gap selection with priority explanation
  - Indicate concurrent processing with fact extraction

- [ ] **5.3** Create `followup-query-generation.tsx`
  - Display selected knowledge gap for next round
  - Show generated queries with diversity strategy
  - Indicate previous queries tried for context
  - Show rationale for query approach

### Phase 6: App Orchestration Updates (`src/cli/app.tsx`)
- [ ] **6.1** Add handling for new step types
  - `knowledge-gap-analysis`
  - `followup-query-generation`

- [ ] **6.2** Update step rendering logic to show concurrent processing
  - Display fact extraction and gap analysis simultaneously
  - Show smooth transition to follow-up query generation
  - Maintain round tracking and progress visualization

### Phase 7: Type System Updates (`src/cli/types.ts`)
- [ ] **7.1** Add new step types
  ```typescript
  export type KnowledgeGapAnalysisStep = {
      type: 'knowledge-gap-analysis';
      data: KnowledgeGapAnalysis;
  };

  export type FollowUpQueryGenerationStep = {
      type: 'followup-query-generation'; 
      data: FollowUpQueryGeneration;
  };
  ```

- [ ] **7.2** Update `AgentState` to include gap history
- [ ] **7.3** Update `Step` union type to include new steps

---

## Abandonment Logic Implementation

### Smart Abandonment Criteria
1. **Attempt Threshold**: 3 rounds spent on same knowledge gap without progress
2. **Thoroughness Assessment**: AI determines gap has been researched thoroughly
3. **Information Availability**: AI concludes information likely doesn't exist publicly

### Abandonment Decision Process
```typescript
// In AnalyzeKnowledgeGaps BAML function
- Evaluate each gap's attempt history
- Check if gap meets abandonment criteria  
- Mark gaps as "abandoned" when appropriate
- Select next highest-priority unanswered gap
- Update gap statuses and reasoning
```

### Query Diversity Strategy
```typescript
// In GenerateFollowUpQueries BAML function
- Analyze all previous queries for current gap
- Identify query patterns and approaches tried
- Generate queries with different:
  - Keywords and terminology
  - Search angles and perspectives  
  - Specificity levels (broad vs narrow)
  - Temporal focus (recent vs historical)
```

---

## Workflow Integration Points

### Current Flow Integration
```typescript
// Before: Single reflection step
reflection = await b.Reflect(/* all responsibilities */);

// After: Multi-step approach
reflection = await b.Reflect(/* gap closure assessment only */);

// Concurrent processing
const [gapAnalysis, extractedFacts] = await Promise.all([
    b.AnalyzeKnowledgeGaps(history, reflection, queryPlan, round),
    extractFactsFromRelevantSources(relevantSources)
]);

// Follow-up query generation
if (gapAnalysis.shouldContinueResearch) {
    followUpQueries = await b.GenerateFollowUpQueries(
        gapAnalysis.nextGapToResearch,
        previousQueries,
        reflection
    );
}
```

### State Management Updates
```typescript
// Track knowledge gap history across rounds
state.knowledgeGapHistory.gaps.push(newGap);
state.knowledgeGapHistory.currentGapIndex = nextGapIndex;

// Update gap statuses based on analysis
updateGapStatuses(state.knowledgeGapHistory, gapAnalysis.updatedGapHistory);
```

---

## Success Criteria

### Functional Requirements
- [ ] Agent no longer gets stuck in infinite loops on unanswerable questions
- [ ] Knowledge gaps are abandoned after appropriate attempt threshold
- [ ] Query diversity prevents repeated identical searches
- [ ] Research quality maintained while avoiding infinite loops
- [ ] Both CLI and Inngest workflows support new architecture

### Performance Requirements  
- [ ] Concurrent processing improves overall research speed
- [ ] Gap analysis adds minimal latency to workflow
- [ ] UI clearly shows multi-step progression
- [ ] Memory usage remains reasonable with gap history tracking

### User Experience Requirements
- [ ] Clear indication of what gaps are being researched
- [ ] Transparent abandonment decisions with reasoning
- [ ] Progress tracking shows gap resolution status
- [ ] Smooth workflow progression despite added complexity

---

## Implementation Strategy

### Phase Prioritization
1. **Phase 1-2**: Core data models and BAML functions (foundation)
2. **Phase 3**: CLI agent integration (primary interface)
3. **Phase 4**: Inngest workflow integration (production scalability)
4. **Phase 5-6**: UI components and orchestration (user experience)
5. **Phase 7**: Type system updates (development experience)

### Testing Strategy
- Test with known unanswerable questions (e.g., private company valuations)
- Verify abandonment logic triggers appropriately
- Ensure query diversity prevents repetition
- Validate concurrent processing works correctly
- Confirm both CLI and Inngest maintain functionality

### Rollback Plan
- Keep existing single-step reflection as fallback
- Feature flag new multi-step approach
- Monitor for regressions in research quality
- Easy revert if abandonment logic too aggressive

---

## Progress Tracking

### ✅ Completed Tasks
- [x] **Planning Phase**: Comprehensive implementation plan created
- [x] **Architecture Design**: Multi-step approach with concurrent processing defined
- [x] **Phase 1**: Data Models & Type Definitions
  - [x] **1.1** Added knowledge gap tracking types to `baml_src/types.baml`
  - [x] **1.2** Added updated Reflection type for gap closure assessment (simplified from ReflectionV2)
  - [x] **1.3** Added new BAML function types (KnowledgeGapAnalysis, FollowUpQueryGeneration)
- [x] **Phase 2**: BAML Function Implementation
  - [x] **2.1** Created `baml_src/analyze_knowledge_gaps.baml` with smart abandonment logic
  - [x] **2.2** Created `baml_src/generate_followup_queries.baml` with query diversity strategy  
  - [x] **2.3** Added gap closure focused `Reflect` function to `baml_src/reflect.baml`
- [x] **Phase 3**: CLI Agent Updates (`src/cli/agent.ts`)
  - [x] **3.1** Added knowledge gap tracking state and imports
  - [x] **3.2** Updated reflection step to use new Reflect function for gap closure assessment
  - [x] **3.3** Implemented concurrent knowledge gap analysis and fact extraction
  - [x] **3.4** Added follow-up query generation step with gap history awareness
  - [x] **3.5** Updated event emission for new steps (knowledge-gap-analysis, followup-query-generation)
- [x] **Phase 4**: Inngest Workflow Updates (`src/inngest/functions/deep-research.ts`)
  - [x] **4.1** Added knowledge gap history tracking to workflow state
  - [x] **4.2** Updated reflection step to use new Reflect function for gap closure assessment
  - [x] **4.3** Implemented concurrent step execution for gap analysis and fact extraction
  - [x] **4.4** Added follow-up query generation as separate step with logging
  - [x] **4.5** Updated channel publishing for new steps (knowledgeGapAnalysis, followUpQueryGeneration)
- [x] **Phase 5**: UI Components (`src/cli/components/`)
  - [x] **5.1** Updated `reflection.tsx` to show gap closure assessment with new Reflection type
  - [x] **5.2** Created `knowledge-gap-analysis.tsx` for gap history and abandonment decisions
  - [x] **5.3** Created `followup-query-generation.tsx` for query generation with diversity strategy
- [x] **Legacy Cleanup**: Removed old Reflect implementation and simplified types
  - [x] **Removed** legacy `Reflect` function and `Reflection` type from BAML files
  - [x] **Simplified** ReflectionV2 → Reflection across all components
  - [x] **Updated** all imports and function calls to use simplified naming
- [x] **Phase 7**: Type System Updates (completed as part of legacy cleanup)
  - [x] **7.1** Updated all imports to use simplified Reflection type
  - [x] **7.2** Updated AgentState and step types in `src/cli/types.ts`
  - [x] **7.3** Updated Step union type to include new knowledge gap steps

### 🔄 In Progress
- [ ] **Phase 6**: App Orchestration Updates (`src/cli/app.tsx`)

### ⏳ Pending
- None remaining - core implementation complete! 