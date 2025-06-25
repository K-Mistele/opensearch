// State management types for the research workflow
class SearchQueryList {
    query string[] @description("A list of search queries to be used for web research.")
    rationale string @description("A brief explanation of why these queries are relevant to the research topic, addressed as though you were speaking to a user explaining what you are doing")
}

class Reflection {
    isSufficient bool @description("Whether the provided summaries are sufficient to answer the user's question")
    knowledgeGap string? @description("A description of what information is missing or needs clarification, if isSufficient is false")
    followUpQueries string[]? @description("A list of follow-up web search queries to be researched to address the knowledge gap, if isSufficient is false")
    followupQueriesRationale string[]? @description("Your rationalee for why these follow-up queries are relevant to the research topic in the context of the knowledge gap, addressed as though you were speaking to a user explaining what you are doing (if isSufficient is false)")
}


class Message {
    role string @description("The role of the message sender (e.g., 'user', 'assistant', 'system')")
    content string @description("The content of the message")
}

class OverallState {
    messages Message[] @description("List of messages in the conversation")
    search_query string[] @description("List of search queries generated")
    web_research_result string[] @description("Results from web research")
    sources_gathered string[] @description("Sources collected during research")
    initial_search_query_count int @description("Initial count of search queries")
    max_research_loops int @description("Maximum number of research loops allowed")
    research_loop_count int @description("Current research loop count")
    reasoning_model string @description("The model used for reasoning")
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