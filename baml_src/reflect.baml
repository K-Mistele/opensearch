function Reflect(
    summaries: SearchResult[],
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
    - Ensure the follow-up queries are self-contained web search queries
    - Each should contain the necessary context AND simplicity to be used as a web search. 
    - Avoid highly complicated follow-up queries, and avoid overly-broad queries. 


    Summaries:
    <summaries>
    {% for summary in summaries %}
        <summary>
            <title>{{summary.title}}</title>
            <url>{{summary.url}}</url>
            <highlights>{{summary.highlights}}</highlights>
        </summary>
    {% endfor %}
    </summaries>

    Reflect carefully on the Summaries to identify knowledge gaps and produce a follow-up query. Then, produce your output following this JSON format:
    {{ctx.output_format}}
    "#
}