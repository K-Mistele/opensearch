// Gap closure focused reflection function
function Reflect(
    summaries: SearchResult[],
    research_topic: string,
    current_date: string,
    queryPlan: string[],
    completedQuestions: int[],
    unansweredQuestions: int[],
    currentGap: string?,
    currentRound: int,
    maxRounds: int,
) -> Reflection {
    client "google-ai/gemini-2.5-flash"
    prompt #"
    You are an expert research analyst focused on gap closure assessment for "{{research_topic}}".

    The current date is {{current_date}}.
    
    Research Progress: This is round {{currentRound}} of {{maxRounds}} maximum rounds.

    CURRENT KNOWLEDGE GAP BEING RESEARCHED:
    {% if currentGap %}
    "{{currentGap}}"
    {% else %}
    No specific gap was being researched this round (initial research phase).
    {% endif %}

    Query Plan:
    The following questions were previously identified as needing to be answered:
    {% for index in range(queryPlan|length) %}
    - {{index}} [{% if index in completedQuestions %}Answered{% else %}Unanswered{% endif %}] {{queryPlan[index]}}
    {% endfor %}

    PRIMARY FOCUS - GAP CLOSURE ASSESSMENT:
    Your main task is to determine if the knowledge gap we were trying to close this round was successfully closed.

    {% if currentGap %}
    SPECIFIC INSTRUCTIONS FOR CURRENT GAP:
    1. **Gap Closure Analysis**: Did the search results this round provide information that closes the knowledge gap "{{currentGap}}"?
    2. **Evidence Evaluation**: Do the summaries contain concrete, specific information that addresses this gap?
    3. **Gap Status**: Mark currentGapClosed as true only if the gap has been definitively addressed with specific evidence
    {% else %}
    INITIAL ROUND INSTRUCTIONS:
    1. **Question Progress**: Analyze which questions from the query plan were answered by this round's results
    2. **Gap Identification**: Identify what knowledge gaps exist based on unanswered questions
    3. **New Gap Discovery**: List any new gaps discovered during analysis
    {% endif %}

    SECONDARY TASKS:
    1. **Question Tracking**: Update which questions from the query plan have been answered this round
    2. **Source Identification**: Identify which summaries contain relevant information
    3. **Overall Sufficiency**: Determine if research overall is sufficient to answer the research topic
    4. **New Gap Identification**: Identify any new knowledge gaps discovered in the analysis

    IMPORTANT OUTPUT REQUIREMENTS:
    - **answeredQuestions**: Return ONLY the question indices (0-based) that were answered THIS ROUND by the current search results
    - **unansweredQuestions**: This field is not used - the system tracks this externally
    - Focus on identifying which questions from the query plan got new answers from this round's search results
    - Do NOT try to maintain cumulative state - only report new answers from this specific round

    ANALYSIS CRITERIA:
    - Be conservative about gap closure - require concrete evidence
    - A gap is only closed if you found specific, detailed information addressing it
    - Mark questions as answered only if they have comprehensive answers with evidence
    - Identify sources that provide unique, relevant information for extraction

    Current Round's Search Results:
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

    Provide your gap closure assessment and analysis:
    {{ctx.output_format}}
    "#
}