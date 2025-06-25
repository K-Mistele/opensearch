test NapthaAiFunding {
    functions [GenerateQuery]
    args {
        args {
            research_topic "What is Naptha AI's most recent funding round in terms of dollars raised and the round size? (pre-seed, seed,Series A, Series B, Series C, Series D)"
            current_date "06/24/2025"
        }

    }
}

test ConstellateAIFunding {
    functions [GenerateQuery]
    args {
       args {
            research_topic "What is Constellate AI's most recent funding round in terms of dollars raised and the round size? (pre-seed, seed,Series A, Series B, Series C, Series D)"
            number_queries 10
            current_date: "06/24/2025"
       }
    }
}

test HumanLayerFunding {
    functions [GenerateQuery]
    args {
        args {
            research_topic "What is Human Layer's most recent funding round in terms of dollars raised and the round size? (pre-seed, seed,Series A, Series B, Series C, Series D)"
            number_queries 10
            current_date: "06/24/2025"
        }
    }
}   

test BoundaryMLFunding {
    functions [GenerateQuery]
    args {
        args {
            research_topic "What is BoundaryML's most recent funding round in terms of dollars raised and the round size? (pre-seed, seed,Series A, Series B, Series C, Series D)"
            number_queries 10
            current_date: "06/24/2025"
        }
    }
}