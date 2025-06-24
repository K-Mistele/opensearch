
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