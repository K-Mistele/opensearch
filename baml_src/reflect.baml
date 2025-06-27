function Reflect(
    summaries: SearchResult[],
    research_topic: string,
    current_date: string,
    queryPlan: string[],
    completedQuestions: int[],
    unansweredQuestions: int[],
    currentRound: int,
    maxRounds: int,
) -> Reflection {
    client "google-ai/gemini-2.5-flash"
    prompt #"
    You are an expert research assistant analyzing summaries about "{{research_topic}}".

    The current date is {{current_date}}.
    
    Research Progress: This is round {{currentRound}} of {{maxRounds}} maximum rounds.

    Query Plan:
    The following questions were previously identified as needing to be answered to fully satisfy the research topic:
    {% for index in range(queryPlan|length) %}
    - {{index}} [{% if index in completedQuestions %}Answered{% else %}Unanswered{% endif %}] {{queryPlan[index]}}
    {% endfor %}

    Instructions:
    - Use the query plan to evaluate if the information provided in the summaries below is sufficient to answer the user's question; focusing on the unanswered parts of the query plan
    - For each unanswered question in the query plan, determine if it has been sufficiently answered by the search results from this round
    - Identify which questions from the plan have been answered and which still need addressing
    - ONLY set isSufficient to true if ALL questions in the query plan have been comprehensively answered with specific, concrete evidence
    - Be conservative: if there's any doubt about whether a question has been fully answered, mark it as unanswered
    - If some questions remain unanswered OR if the answers lack specific details, set isSufficient to false and generate follow-up queries to address the remaining questions
    - Require concrete facts, numbers, dates, and specific details - not just general information - to consider a question answered
    
    Round-Specific Guidance:
    {% if currentRound <= 3 %}
    - EARLY RESEARCH PHASE: Be extra conservative. It's very unlikely that complex research questions can be fully answered in just {{currentRound}} rounds
    - Only mark research as sufficient if you have overwhelming evidence for ALL questions
    - Prefer to continue researching rather than conclude prematurely
    {% elif currentRound >= maxRounds - 1 %}
    - FINAL RESEARCH PHASE: You're near the end of available rounds. Be more decisive about what constitutes sufficient information
    - Focus on whether you have enough information to provide a meaningful answer, even if not perfect
    {% endif %}

    CRITICAL - Relevant Summary Selection for This Round:
    - You are analyzing summaries from THIS ROUND of searches only
    - Identify which of these summaries contain information that is DIRECTLY relevant to answering the research topic or addressing the query plan
    - A summary should be marked as relevant if it contains information that helps answer any part of the research question or query plan
    - Be selective but not overly restrictive - include summaries that provide useful context, facts, or insights related to the research topic
    - Include the summary IDs (not indexes) in the relevantSummaryIds field for summaries that contribute meaningful information
    
    If the information in the summaries is insufficient to answer all questions in the query plan:
    - Identify knowledge gaps based on the unanswered questions from the query plan
    - Generate follow-up queries that specifically target the unanswered questions
    - Ensure follow-up queries are designed to find information that addresses the specific unanswered questions

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

    Reflect carefully on these summaries against the query plan, identify which summaries are relevant for answering the research topic, and determine which questions have been answered. Then, produce your output following this JSON format:
    {{ctx.output_format}}
    "#
}