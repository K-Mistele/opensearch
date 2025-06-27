function ExtractRelevantFacts(
    relevantSources: SearchResult[],
    research_topic: string,
    queryPlan: string[],
    reflection: Reflection,
    current_date: string
) -> ExtractedFact[] {
    client "google-ai/gemini-2.5-flash"
    prompt #"
    You are an expert research assistant extracting key facts from sources to answer research questions about "{{research_topic}}".

    The current date is {{current_date}}.

    CONTEXT:
    The following sources have been identified as containing relevant information for this research topic. Your task is to extract only the most important facts from each source that directly relate to answering the research questions.

    Query Plan (Research Questions to Address):
    {% for index in range(queryPlan|length) %}
    - {{index}}: {{queryPlan[index]}}
    {% endfor %}

    {% if reflection.knowledgeGap %}
    Knowledge Gap Analysis:
    Current Knowledge Gap: {{reflection.knowledgeGap}}
    {% endif %}

    INSTRUCTIONS:
    - For each source, extract ONLY the facts that are directly relevant to answering the research questions in the query plan
    - Each fact should be at maximum 2-3 sentences and contain specific, concrete information or context that is relevant to the research questions
    - Extract only what's necessary - if a source only has 1 relevant fact, extract 1 fact (don't force more)
    - Maximum 5 facts per source, but extract fewer if that's all that's relevant
    - Focus on concrete details: numbers, dates, specific claims, evidence, etc.
    - Avoid general statements or background information unless directly relevant to the research questions
    - Each fact should be self-contained and understandable on its own
    - Preserve the essence of the information while making it concise
    - do not duplicate facts from other sources - if a fact is already extracted from another source, do not extract it again
    - IMPORTANT: Make sure the sourceId you provide EXACTLY matches the id of the source you're extracting from

    RELEVANCE CRITERIA:
    - The fact must help answer at least one question from the query plan
    - The fact must contain specific, actionable information (not just context)
    - The fact must be unique and not duplicate information from other sources

    SOURCE FORMAT:
    For each source, provide:
    1. The sourceId (must exactly match the source's id)
    2. A brief summary of the source / why the source is relevant to the research topic
    3. The extracted facts that answer the research questions

    Sources to Process:
    <sources>
    {% for source in relevantSources %}
        <source>
            <id>{{source.id}}</id>
            <title>{{source.title}}</title>
            <url>{{source.url}}</url>
            <highlights>{{source.highlights}}</highlights>
            <text>{{source.text}}</text>
        </source>
    {% endfor %}
    </sources>

    Extract the relevant facts following this format:
    {{ctx.output_format}}
    "#
} 