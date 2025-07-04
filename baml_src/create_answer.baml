function CreateAnswer(
    current_date: string,
    research_topic: string,
    summaries: SearchResult[],
) -> string {
    client "google-ai/gemini-2.5-pro"
    prompt #"
        Generate a high-quality answer formatted in markdown to the user's question based on the provided summaries.

        Instructions:
        - The current date is {{current_date}}.
        - You are the final step of a multi-step research process, don't mention that you are the final step. 
        - You have access to all the information gathered from the previous steps.
        - You have access to the user's question.
        - Generate a high-quality answer to the user's question based on the provided summaries and the user's question.
        - To include the sources you used from the Summaries in the answer correctly, use markdown footnotes. This creates a superscript number with a link to jump to the footnote. You can put footnotes anywhere in the document except inside other markdown elements like blocks, lists, and tables. 
        - When you use a footnote, you should use the id of the summary as the footnote id - the links at the bottom of the document will be added _for you_ - there is no need to add them yourself.
        - If you use a footnote, you need to make sure that the ID of the footnote EXACTLY matches the ID of the summary.

        <markdown_footnotes_example>
            Here's a simple footnote,[^abc789a] and here's a longer one.[^90fdaha]

            Note that the citations will be added for you - there is no need to add them yourself. They will be auto-generated like this:
            [^abc789a]: This is the first footnote.

            [^90fdaha]: Here's another footnote.

            Here are two footnotes in a row: [^abcdefg,hijklmn]
        </markdown_footnotes_example>

        Very important instructions:
        - if the information is not sufficient, you should indicate to the user that you don't have enough information to answer the question.
        - make sure to indicate how confident you are in the answer, and why.
        - Never use tables in your answer - you many use newlines, bold, italics, lists, links, and footnotes. 

        User Context:
        - {{research_topic}}

        Summaries:
        <summaries>
        {% for summary in summaries %}
            <summary>
                <id>{{summary.id}}</id>
                <title>{{summary.title}}</title>                
                <url>{{summary.url}}</url>
                <highlights>{{summary.highlights}}</highlights>
                <text>{{summary.text}}</text>
            </summary>
        {% endfor %}
        </summaries>

        Reflect carefully on all the the summaries and the user's question to provide an answer.
        {{ctx.output_format}}

    "#
}

function CreateAnswerFromFacts(
    current_date: string,
    research_topic: string,
    extractedFacts: ExtractedFact[],
) -> string {
    client "google-ai/gemini-2.5-pro"
    prompt #"
        Generate a high-quality answer formatted in markdown to the user's question based on the provided extracted facts.

        Instructions:
        - The current date is {{current_date}}.
        - You are the final step of a multi-step research process, don't mention that you are the final step. 
        - You have access to concise, relevant facts that have been extracted from the research process.
        - Generate a high-quality answer to the user's question based on the provided facts and the user's question.
        - To include the sources you used from the Facts in the answer correctly, use markdown footnotes. This creates a superscript number with a link to jump to the footnote. You can put footnotes anywhere in the document except inside other markdown elements like blocks, lists, and tables. 
        - When you use a footnote, you should use the sourceId of the fact as the footnote id - the links at the bottom of the document will be added _for you_ - there is no need to add them yourself.
        - If you use a footnote, you need to make sure that the ID of the footnote EXACTLY matches the sourceId of the fact.

        <markdown_footnotes_example>
            Here's a simple footnote,[^abc789a] and here's a longer one.[^90fdaha]

            Note that the citations will be added for you - there is no need to add them yourself. They will be auto-generated like this:
            [^abc789a]: This is the first footnote.

            [^90fdaha]: Here's another footnote.

            Here are two footnotes in a row: [^abcdefg,hijklmn]
        </markdown_footnotes_example>

        Very important instructions:
        - if the information is not sufficient, you should indicate to the user that you don't have enough information to answer the question.
        - make sure to indicate how confident you are in the answer, and why.
        - Never use tables in your answer - you many use newlines, bold, italics, lists, links, and footnotes. 
        - The facts provided are already concise and relevant - use them directly to build your comprehensive answer.

        User Context:
        - {{research_topic}}

        Extracted Facts:
        <facts>
        {% for fact in extractedFacts %}
            <factSet>
                <sourceId>{{fact.sourceId}}</sourceId>
                <summary>{{fact.summary}}</summary>
                <relevantFacts>
                    {% for relevantFact in fact.relevantFacts %}
                    - {{relevantFact}}
                    {% endfor %}
                </relevantFacts>
            </factSet>
        {% endfor %}
        </facts>

        Reflect carefully on all the extracted facts and the user's question to provide a comprehensive answer.
        {{ctx.output_format}}

    "#
}
