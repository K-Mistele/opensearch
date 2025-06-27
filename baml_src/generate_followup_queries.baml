function GenerateFollowUpQueries(
    targetGap: string,
    previousQueries: string[],
    reflection: Reflection,
    queryPlan: string[],
    currentRound: int,
    unansweredQuestions: int[]
) -> FollowUpQueryGeneration {
    client "google-ai/gemini-2.5-flash"
    prompt #"
        You are an expert search query strategist generating diverse follow-up queries to address a specific knowledge gap.

        CONTEXT:
        - Current research round: {{currentRound}}
        - You need to generate queries that will help close a specific knowledge gap
        - You must ensure query diversity and avoid repeating previous failed attempts

        TARGET KNOWLEDGE GAP:
        {{targetGap}}

        QUERY PLAN CONTEXT:
        {% for index in range(queryPlan|length) %}
        - {{index}}: {{queryPlan[index]}}
        {% endfor %}

        PREVIOUS QUERIES ATTEMPTED FOR THIS GAP:
        {% if previousQueries|length > 0 %}
        {% for query in previousQueries %}
        - "{{query}}"
        {% endfor %}
        {% else %}
        No previous queries have been attempted for this specific gap.
        {% endif %}

        REFLECTION INSIGHTS:
        Questions answered this round: 
        {% for question in reflection.answeredQuestions %}
        - {{question}}
        {% endfor %}
        Questions still unanswered: 
        {% for question in unansweredQuestions %}
        - {{question}}: {{queryPlan[question]}}
        {% endfor %}
        Current gap closed: {{reflection.currentGapClosed}}
        Relevant sources found: 
        {% for source in reflection.relevantSummaryIds %}
        - {{source}}
        {% endfor %}

        QUERY DIVERSITY STRATEGIES:
        You MUST ensure the new queries are diverse and different from previous attempts. Apply these strategies:

        1. **Keyword Variation**: Use different terminology, synonyms, and industry-specific terms
        2. **Search Angles**: Approach the topic from different perspectives (company, industry, investor, regulatory, news)
        3. **Specificity Levels**: Mix broad context queries with highly specific targeted searches
        4. **Temporal Focus**: Try different time periods (recent, historical, specific years/quarters)
        5. **Source Types**: Target different types of sources (news, reports, filings, interviews, databases)
        6. **Geographic Scope**: Consider different geographic markets or regions if relevant

        QUERY GENERATION RULES:
        - Generate 2-4 queries maximum (focus on quality over quantity)
        - Each query should target the specific knowledge gap from a different angle
        - Avoid repeating any previous query patterns or keywords
        - Ensure queries are suitable for Exa Search API (no Google-specific operators)
        - Make queries specific enough to find targeted information
        - Include important qualifiers and modifiers for precision

        EXAMPLE DIVERSITY APPROACHES:
        If previous queries focused on "company funding", try:
        - "venture capital investment [company]"
        - "[company] Series A B C funding rounds"  
        - "[company] investor relations financial backing"
        - "[company] startup financing valuation"

        CRITICAL REQUIREMENT:
        Analyze the previous queries carefully and ensure your new queries use:
        - Completely different keywords and phrases
        - Different search approaches and angles
        - Alternative ways to describe the same information need

        Generate your diverse follow-up queries and explain your strategy:
        {{ctx.output_format}}
    "#
} 