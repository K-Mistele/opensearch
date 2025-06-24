
class GenerateQueryArgs {
    research_topic string
    current_date string
    number_queries int?
}
/// Generate an optimized query (or several) for web research
function GenerateQuery(
    args: GenerateQueryArgs,
) -> SearchQueryList {
    client "google-ai/gemini-2.5-flash"
    prompt #"
    
        {{ _.role("system")}}
        Your goal is to generate sophisticated and diverse web search queries. These queries are intended for an advanced automated web research tool capable of analyzing complex results, following links, and synthesizing information.

        Instructions:
        - Always prefer a single search query, only add another query if the original question requests multiple aspects or elements and one query is not enough.
        - Each query should focus on one specific aspect of the original question.
        {% if args.number_queries %}
        - Don't produce more than {{args.number_queries}} queries.
        {% elif args.number_queries == 1 %}
        - Generate 1 query.
        {% else %}
        - Generate a few queries
        {% endif %}
        - Queries should be diverse, if the topic is broad, generate more than 1 query to get sufficient coverage of different keywords and assumptions.
        - Don't generate multiple similar queries, 1 is enough.
        - Query should ensure that the most current information is gathered. The current date is {{current_date}}.

        The research topic is provided between <research_topic></research_topic> XML tags below.
        <research_topic>
        {{ args.research_topic}}
        </research_topic>


        <output_format>
        {{ ctx.output_format }}
        </output_format>
    "#
}

test NapthaAiFunding {
    functions [GenerateQuery]
    args {
        args {
            research_topic "What is Naptha AI's most recent funding round in terms of dollars raised and the round size? (pre-seed, seed,Series A, Series B, Series C, Series D)"
            current_date "06/24/2025"
        }

    }
}

test ConstellateAIFunding {
    functions [GenerateQuery]
    args {
       args {
            research_topic "What is Constellate AI's most recent funding round in terms of dollars raised and the round size? (pre-seed, seed,Series A, Series B, Series C, Series D)"
            number_queries 10
            current_date: "06/24/2025"
       }
    }
}

test HumanLayerFunding {
    functions [GenerateQuery]
    args {
        args {
            research_topic "What is Human Layer's most recent funding round in terms of dollars raised and the round size? (pre-seed, seed,Series A, Series B, Series C, Series D)"
            number_queries 10
            current_date: "06/24/2025"
        }
    }
}   

test BoundaryMLFunding {
    functions [GenerateQuery]
    args {
        args {
            research_topic "What is BoundaryML's most recent funding round in terms of dollars raised and the round size? (pre-seed, seed,Series A, Series B, Series C, Series D)"
            number_queries 10
            current_date: "06/24/2025"
        }
    }
}