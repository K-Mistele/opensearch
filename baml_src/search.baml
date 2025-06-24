class SearchQueryList {
    query string[] @description("A list of search queries to be used for web research.")
    rationale string @description("A brief explanation of why these queries are relevant to the research topic.")
}
class SufficientReflection {
    isSufficient true @description("Whether the provided summaries are sufficient to answer the user's question")
}

class InsufficientReflection {
    isSufficient false @description("Whether the provided summaries are sufficient to answer the user's question")
    knowledgeGap bool @description("A description of what information is missing or needs clarification")
    followUpQueries string[] @description("A list of follow-up questions to be researched to address the knowledge gap")
}

type Reflection = SufficientReflection | InsufficientReflection

/// Generate an optimized query (or several) for web research
function GenerateQuery(
    research_topic: string,
    number_queries: int,
    current_date: string,
) -> SearchQueryList {
    client "google-ai/gemini-2.5-flash"
    prompt #"
    
        {{ _.role("system")}}
        Your goal is to generate sophisticated and diverse web search queries. These queries are intended for an advanced automated web research tool capable of analyzing complex results, following links, and synthesizing information.

        Instructions:
        - Always prefer a single search query, only add another query if the original question requests multiple aspects or elements and one query is not enough.
        - Each query should focus on one specific aspect of the original question.
        - Don't produce more than {{number_queries}} queries.
        - Queries should be diverse, if the topic is broad, generate more than 1 query.
        - Don't generate multiple similar queries, 1 is enough.
        - Query should ensure that the most current information is gathered. The current date is {{current_date}}.

        The research topic is provided between <research_topic></research_topic> XML tags below.
        <research_topic>
        {{ research_topic}}
        </research_topic>


        <output_format>
        {{ ctx.output_format }}
        </output_format>
    "#
}

function WebSearch(
    current_date: string,
    research_topic: string,
) -> string {
    client "google-ai/gemini-2.5-flash"
    prompt #"
    Conduct targeted Google Searches to gather the most recent, credible information on "{{research_topic}}" and synthesize it into a verifiable text artifact.

    Instructions:
    - Query should ensure that the most current information is gathered. The current date is {{current_date}}.
    - Conduct multiple, diverse searches to gather comprehensive information.
    - Consolidate key findings while meticulously tracking the source(s) for each specific piece of information.
    - The output should be a well-written summary or report based on your search findings. 
    - Only include the information found in the search results, don't make up any information.

    Research Topic:
    {{research_topic}}
    "#
}

function Reflect(
    summaries: string,
    research_topic: string,
) -> Reflection {
    client "google-ai/gemini-2.5-pro"
    prompt #"
    You are an expert research assistant analyzing summaries about "{{research_topic}}".
    Instructions:
    - Identify knowledge gaps or areas that need deeper exploration and generate a follow-up query. (1 or multiple).
    - If provided summaries are sufficient to answer the user's question, don't generate a follow-up query.
    - If there is a knowledge gap, generate a follow-up query that would help expand your understanding.
    - Focus on technical details, implementation specifics, or emerging trends that weren't fully covered.

    Requirements:
    - Ensure the follow-up query is self-contained and includes necessary context for web search.

    Reflect carefully on the Summaries to identify knowledge gaps and produce a follow-up query. Then, produce your output following this JSON format:
    {{ctx.output_format}}

    Example:
    ```json
    {
        "is_sufficient": true, // or false
        "knowledge_gap": "The summary lacks information about performance metrics and benchmarks", // "" if is_sufficient is true
        "follow_up_queries": ["What are typical performance benchmarks and metrics used to evaluate [specific technology]?"] // [] if is_sufficient is true
    }
    ```

    Summaries:
    {% for summary in summaries %}
        <summary>
        {{summary}}
        </summary>
    {% endfor %}
    "#
}

function CreateAnswer(
    current_date: string,
    research_topic: string,
    summaries: string[],
) -> string {
    client "google-ai/gemini-2.5-pro"
    prompt #"
        Generate a high-quality answer to the user's question based on the provided summaries.

        Instructions:
        - The current date is {{current_date}}.
        - You are the final step of a multi-step research process, don't mention that you are the final step. 
        - You have access to all the information gathered from the previous steps.
        - You have access to the user's question.
        - Generate a high-quality answer to the user's question based on the provided summaries and the user's question.
        - Include the sources you used from the Summaries in the answer correctly, use markdown format (e.g. [apnews](https://vertexaisearch.cloud.google.com/id/1-0)). THIS IS A MUST.

        User Context:
        - {{research_topic}}

        Summaries:
        {% for summary in summaries %}
            <summary>
            {{summary}}
            </summary>
        {% endfor %}
    "#
}