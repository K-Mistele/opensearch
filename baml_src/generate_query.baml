/// Generate an optimized query (or several) for web research
function GenerateQuery(
    args: GenerateQueryArgs,
) -> SearchQueryList {
    client "google-ai/gemini-2.5-flash"
    prompt #"
    
        {{ _.role("system")}}
        Your goal is to generate sophisticated and diverse web search queries AND create a comprehensive query plan. These queries are intended for an advanced automated web research tool capable of analyzing complex results, following links, and synthesizing information.

        Instructions for Search Queries:
        - Always prefer a single search query, only add another query if the original question requests multiple aspects or elements and one query is not enough.
        - Each query should focus on one specific aspect of the original question.

        {% if args.number_queries == 1 %}
        - Generate 1 query.
        {% elif args.number_queries %}
        - Don't produce less than 2 queries.
        - Don't produce more than {{args.number_queries}} queries.
        {% else %}
        - Generate a few queries
        {% endif %}
        - Queries should be diverse, if the topic is broad, generate more than 1 query to get sufficient coverage of different keywords and assumptions.
        - Don't generate multiple similar queries, 1 is enough.
        - Queries should be specific and not too broad. Make sure to include important qualifiers and modifiers.
        - Query should ensure that the most current information is gathered. The current date is {{args.current_date}}.
        - We are using Exa's Search API so the queries should not use google-specific search operators
        - If the query is complicated or multi-part (e.g. about multiple different people, businesses, entities or topics), break it down into multiple queries.

        Instructions for Query Plan:
        - Create a comprehensive list of specific questions that need to be answered to fully satisfy the user's research topic by deconstructing the research topic into smaller, more specific questions
        - These questions should be detailed and specific, covering all aspects of the research topic
        - Questions should not include information which you already know the answer to, such as common knowledge.
        - The questions should be answerable through web research and should guide the evaluation of whether research is complete
        - Think about what a complete answer to the research topic would need to include, then break that down into specific questions
        - Questions should be comprehensive enough that if all are answered, the research topic is fully addressed
        - They should follow the SMART: Specific, Measurable, Achievable, and Relevant criteria.

        The research topic is provided between <research_topic></research_topic> XML tags below.
        <research_topic>
        {{ args.research_topic}}
        </research_topic>

        <output_format>
        {{ ctx.output_format }}
        </output_format>
    "#
}

