class GenerateQueryArgs {
    research_topic string
    current_date string
    number_queries int?
}
// State management types for the research workflow
class SearchQueryList {
    queryPlan string[] @description("A list of specific questions that need to be answered to satisfy the user's research topic. These questions will be used to determine if the research is complete.")
    query string[] @description("A list of search queries to be used for web research.")
    rationale string @description("A brief explanation of why these queries are relevant to the research topic, addressed as though you were speaking to a user explaining what you are doing")
}

class Reflection {
    isSufficient bool @description("Whether research is complete overall")
    answeredQuestions int[] @description("Cumulative list of query plan question indices that have been answered across all rounds so far")
    unansweredQuestions int[] @description("Cumulative list of query plan question indices that remain unanswered across all rounds so far")
    relevantSummaryIds string[] @description("Sources with relevant information")
    currentGapClosed bool @description("Whether the knowledge gap we were trying to close this round was successfully closed")
    newGapsIdentified string[]? @description("Any new knowledge gaps discovered this round")
}

class Message {
    role string @description("The role of the message sender (e.g., 'user', 'assistant', 'system')")
    content string @description("The content of the message")
}

class ReflectionState {
    is_sufficient bool @description("Whether the current information is sufficient")
    knowledge_gap string @description("Description of the knowledge gap identified")
    follow_up_queries string[] @description("Follow-up queries to address knowledge gaps")
    research_loop_count int @description("Current research loop count")
    number_of_ran_queries int @description("Number of queries that have been executed")
}

class Query {
    query string @description("The search query string")
    rationale string @description("Rationale for why this query is needed")
}

class QueryGenerationState {
    search_query Query[] @description("List of generated queries with rationales")
}

class WebSearchState {
    search_query string @description("The search query to execute")
    id string @description("Unique identifier for the search")
}

class SearchStateOutput {
    running_summary string? @description("Final report or running summary of research")
} 

class SearchResult {
    url string @description("The URL of the search result")
    id string @description("The ID of the search result")
    title string? | null @description("The title of the search result")
    highlights string[] @description("The highlights of the search result")
    highlightScores float[] @description("The highlight scores of the search result")
    text string @description("The text of the search result")
}

class ExtractedFact {
    sourceId string @description("ID matching the original Search Result for citation purposes")
    relevantFacts string[] @description("Array of concise facts relevant to the query plan (max 5 facts, 2-3 sentences each, only extract what's necessary)")
    summary string @description("Brief summary of the source's relevance to the research topic")
}

// Knowledge Gap History Tracking Types
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



// Knowledge Gap Analysis types
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