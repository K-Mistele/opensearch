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