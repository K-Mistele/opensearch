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