# Follow-up Queries Strategy & Implementation

## Overview

Follow-up queries are **already fully implemented** in both the CLI agent (`src/cli/agent.ts`) and Inngest workflow (`src/inngest/functions/deep-research.ts`). This document outlines the current implementation and recent enhancements made to improve the user experience.

## Current Implementation

### Core Flow

1. **Initial Query Generation**: Generate search queries based on research topic
2. **Search Execution**: Execute queries and gather results
3. **Reflection Analysis**: AI analyzes results and determines if information is sufficient
4. **Follow-up Decision**: If insufficient, generate follow-up queries to address knowledge gaps
5. **Iteration**: Repeat until sufficient information is gathered or max rounds reached

### Key Components

#### Agent Implementation (`src/cli/agent.ts`)
```typescript
// Lines 154-165: Follow-up query handling  
if (!reflection.followUpQueries)
    throw new Error('Follow-up queries are not specified but should be!');
queries = reflection.followUpQueries;

// Emit follow-up queries for UI display
eventEmitter.emit('state-update', {
    type: 'queries-generated',
    data: {
        query: reflection.followUpQueries,
        rationale: reflection.knowledgeGap || 'Additional information needed',
        queryPlan: initialQueries.queryPlan,
    }
});
```

#### BAML Reflection Function (`baml_src/reflect.baml`)
- Analyzes search results against the original query plan
- Identifies answered vs unanswered questions
- Generates targeted follow-up queries when information is insufficient
- Returns structured reflection with knowledge gaps and follow-up queries

#### UI Components
- **QueryGeneration**: Displays both initial and follow-up queries with visual distinction
- **ReflectionStep**: Shows analysis results and knowledge gaps
- **App**: Orchestrates the entire flow with proper state management

## Recent Enhancements

### 1. **Round Tracking & Visualization**
- Added round numbers to query generation and reflection components
- Visual progress indicators showing research iteration count
- Better user understanding of research depth

### 2. **Progress Indicators**
- Query plan progress tracking (X/Y questions answered)
- Percentage completion display
- Visual feedback on research completeness

### 3. **Enhanced Follow-up Query Display**
- Clear distinction between initial and follow-up queries
- Knowledge gap explanations for follow-up queries
- Improved visual hierarchy and information flow

### 4. **Type Safety Improvements**
- Better TypeScript support for optional reflection props
- Proper type narrowing for follow-up query scenarios
- Enhanced error handling and validation

## Technical Details

### Event Flow
```
1. input -> Initial research topic
2. queries-generated -> Initial queries (isFollowUp: false)
3. searching -> Query execution status
4. search-results -> Search results display
5. reflection-complete -> Analysis results
6. [IF INSUFFICIENT] queries-generated -> Follow-up queries (isFollowUp: true)
7. [REPEAT 3-6] Until sufficient or max rounds
8. answer -> Final comprehensive answer
```

### UI State Management
- `steps[]`: Array of all workflow steps
- `queryPlan[]`: Original questions to be answered
- `currentRound`: Calculated based on completed reflections
- `getRoundNumber()`: Helper to determine round for any step

### Follow-up Query Identification
```typescript
// Determine if queries are follow-ups based on previous insufficient reflections
const isFollowUpQuery = steps.slice(0, index).some(step => 
    step.type === 'reflection-complete' && !step.data.isSufficient
);
```

## Testing Strategy

### Real Integration Tests (`test/follow-up-integration.test.ts`)
- **Validates actual logic**: Tests the real step identification logic used in app.tsx
- **Tests round calculation**: Verifies round number calculation based on reflection steps  
- **Tests progress calculation**: Validates progress percentage calculations
- **Tests type structure**: Ensures proper TypeScript types for all step interfaces
- **No useless mocks**: Tests actual implementation logic, not mocked behavior

### Manual Testing Script (`scripts/test-follow-up-queries.ts`)
- **Real environment testing**: Runs actual agent with BAML functions and Exa API calls
- **Event flow validation**: Captures and analyzes real event sequences
- **Comprehensive checks**: Validates 7 different aspects of follow-up query functionality
- **Usage**: `bun run scripts/test-follow-up-queries.ts`
- **Real research topic**: Uses complex topic that requires multiple rounds

### Manual Testing
1. Choose a research topic requiring multiple rounds
2. Verify initial queries are generated
3. Confirm reflection identifies knowledge gaps
4. Validate follow-up queries are generated and executed
5. Check final answer incorporates all research rounds

## Usage Examples

### Simple Follow-up Scenario
```
Topic: "Latest developments in AI safety research 2024"

Round 1: General AI safety research queries
Reflection: Missing recent 2024 developments
Round 2: Follow-up queries focused on 2024 publications
Result: Comprehensive answer covering historical and recent developments
```

### Complex Multi-round Scenario
```
Topic: "Compare startup funding trends in fintech vs healthtech"

Round 1: General funding trend queries
Reflection: Missing healthtech specific data
Round 2: Follow-up healthtech funding queries
Reflection: Missing comparative analysis data
Round 3: Follow-up comparative analysis queries
Result: Detailed comparison with specific metrics
```

## Best Practices

### For Users
- Use specific, focused research topics for better follow-up generation
- Expect 2-3 rounds for complex topics
- Review progress indicators to understand research depth

### For Developers
- Monitor reflection quality to ensure good follow-up generation
- Adjust max rounds based on topic complexity
- Consider rate limiting for production deployments

## Troubleshooting

### Common Issues
1. **No follow-up queries generated**: Check BAML Reflect function prompts
2. **Infinite loops**: Verify max rounds setting and reflection logic
3. **UI not updating**: Check event emission and state management

### Debug Steps
1. Enable logging in agent and Inngest functions
2. Monitor reflection outputs for isSufficient flag
3. Verify followUpQueries array is populated
4. Check UI event handling for queries-generated events

## Future Enhancements

### Potential Improvements
- **Smart stopping**: Better heuristics for when to stop research
- **Query optimization**: Learn from previous searches to improve follow-ups
- **Parallel follow-ups**: Execute multiple follow-up strategies simultaneously
- **User feedback**: Allow users to guide follow-up directions
- **Caching**: Avoid redundant searches across sessions

### Performance Optimizations
- Rate limiting and throttling
- Result caching and deduplication
- Smarter search result filtering
- Adaptive round limits based on topic complexity

## Conclusion

Follow-up queries provide a powerful mechanism for iterative research that mimics human research patterns. The current implementation is robust and user-friendly, with recent enhancements improving visibility and user experience. The system successfully handles complex research topics requiring multiple rounds of investigation. 