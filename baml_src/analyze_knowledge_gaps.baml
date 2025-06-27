function AnalyzeKnowledgeGaps(
    gapHistory: KnowledgeGapHistory,
    reflection: Reflection,
    queryPlan: string[],
    currentRound: int
) -> KnowledgeGapAnalysis {
    client "google-ai/gemini-2.5-pro"
    prompt #"
        You are an expert research strategist analyzing knowledge gaps and making decisions about research continuation.

        CONTEXT:
        - Current research round: {{currentRound}}
        - Research has been analyzing results and may have closed some knowledge gaps
        - You need to decide whether to continue research or generate the final answer
        - If continuing, select which knowledge gap to focus on next

        CURRENT REFLECTION RESULTS:
        Research sufficient: {{reflection.isSufficient}}
        Current gap closed: {{reflection.currentGapClosed}}
        Questions answered this round: 
        {% for question in reflection.answeredQuestions %}
            - {{question}}
        {% endfor %}
        - Questions still unanswered: 
        {% for question in reflection.unansweredQuestions %}
            - {{question}}
        {% endfor %}
        - New gaps identified: {{reflection.newGapsIdentified}}

        QUERY PLAN (Original research questions):
        {% for index in range(queryPlan|length) %}
        - {{index}}: {{queryPlan[index]}}
        {% endfor %}

        KNOWLEDGE GAP HISTORY:
        {% if gapHistory.gaps|length > 0 %}
        Previous gaps attempted:
        {% for index in range(gapHistory.gaps|length) %}
        Gap {{index}}:
        - Description: {{gapHistory.gaps[index].description}}
        - Status: {{gapHistory.gaps[index].status}}
        - Attempt count: {{gapHistory.gaps[index].attemptCount}}
        - Related questions from query plan: 
        {% for questionId in gapHistory.gaps[index].relatedQuestionIds %}
            - {{queryPlan[questionId]}}
        {% endfor %}
        - First attempted: Round {{gapHistory.gaps[index].firstAttemptedRound}}
        - Last attempted: Round {{gapHistory.gaps[index].lastAttemptedRound}}
        - Previous queries tried: {{gapHistory.gaps[index].previousQueries}}
        {% endfor %}

        Current gap being researched: {% if gapHistory.currentGapIndex != -1 %}Gap {{gapHistory.currentGapIndex}}{% else %}None{% endif %}
        {% else %}
        This is the first research round - no gaps have been attempted yet.
        {% endif %}

        ABANDONMENT CRITERIA:
        A knowledge gap should be marked as "abandoned" if ANY of these conditions are met:
        1. **3-Round Rule**: The gap has been attempted for 3+ rounds without being resolved
        2. **Thoroughness Assessment**: Based on the queries tried, you determine the gap has been researched thoroughly and information likely doesn't exist publicly
        3. **Diminishing Returns**: Recent attempts show no new relevant information being found

        INSTRUCTIONS:
        1. **Analyze Current Gap Status**: 
           - If a gap was being researched this round, determine if it was closed based on reflection results
           - Update the status of the current gap (resolved/continuing/abandoned)

        2. **Process New Gaps**: 
           - If new gaps were identified in reflection, add them to the gap history
           - Assign them to the appropriate query plan questions

        3. **Abandonment Decisions**:
           - Review all gaps and apply abandonment criteria
           - Be conservative but realistic - don't abandon gaps too quickly
           - Mark gaps as "abandoned" when appropriate with clear reasoning

        4. **Next Gap Selection**:
           - If research should continue, select the next gap to focus on
           - Prioritize gaps addressing unanswered questions from the query plan
           - Consider gap difficulty and likelihood of finding information
           - Avoid gaps that have been abandoned

        5. **Research Continuation Decision**:
           - Set shouldContinueResearch to true if there are active gaps worth pursuing
           - Set to false if all important gaps are resolved/abandoned or research is sufficient

        DECISION FRAMEWORK:
        - If reflection.isSufficient is true → shouldContinueResearch = false
        - If all gaps are resolved or abandoned → shouldContinueResearch = false  
        - If there are active gaps with <3 attempts → shouldContinueResearch = true
        - If there are new gaps to investigate → shouldContinueResearch = true

        Provide your analysis and decisions:
        {{ctx.output_format}}
    "#
} 