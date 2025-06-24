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