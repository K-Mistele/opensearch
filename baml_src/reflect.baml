function Reflect(
    summaries: SearchResult[],
    research_topic: string,
    current_date: string,
) -> Reflection {
    client "google-ai/gemini-2.5-pro"
    prompt #"
    You are an expert research assistant analyzing summaries about "{{research_topic}}"..

    The current date is {{current_date}}.

    Instructions:
    - Identify if the information provided in the summaries is sufficient to answer the user's question. 
    - If the information is sufficient, set isSufficient to true. Do not generate a follow-up query.
    
    If the information in the summaries is insufficient, identify knowlege gaps and write follow-up queries to address them:
    - Identify knowledge gaps or areas that need deeper exploration and generate a follow-up query. (1 or multiple).
    - If provided summaries are sufficient to answer the user's question, don't generate a follow-up query.
    - Generate one or more follow-up queries that would help expand your understanding.
    - Focus on technical details, implementation specifics, or emerging trends that weren't fully covered.

    Requirements:
    - Ensure the follow-up queries are self-contained web search queries
    - Each should contain the necessary context AND simplicity to be used as a web search. 
    - Avoid highly complicated follow-up queries, and avoid overly-broad queries. 

    Follow-Up queries structuring:
    - If the query is complicated or multi-part (e.g. about multiple different entities or topics), break it down into multiple queries.
    - If you generate multiple queries, make sure they are diverse and not similar.
    - Queries should be diverse, if the topic is broad, generate more than 1 query to get sufficient coverage of different keywords and assumptions.
    - Don't generate multiple similar queries, 1 is enough.
    - Queries should be specific and not too broad. Make sure to include important qualifiers and modifiers.
    - We are using Exa's Search API so the queries should not use google-specific search operators


    Summaries:
    <summaries>
    {% for summary in summaries %}
        <summary>
            <title>{{summary.title}}</title>
            <url>{{summary.url}}</url>
            <highlights>{{summary.highlights}}</highlights>
            <id>{{summary.id}}</id>
            <text>{{summary.text}}</text>
        </summary>
    {% endfor %}
    </summaries>

    Reflect carefully on the Summaries to identify knowledge gaps and produce a follow-up query. Then, produce your output following this JSON format:
    {{ctx.output_format}}
    "#
}