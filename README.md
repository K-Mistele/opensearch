# OpenSearch: AI-Powered Multi-Round Research Agent

```
  ██████╗  ██████╗  ███████╗ ███╗   ██╗ ███████╗ ███████╗  █████╗  ██████╗   ██████╗ ██╗  ██╗
 ██╔═══██╗ ██╔══██╗ ██╔════╝ ████╗  ██║ ██╔════╝ ██╔════╝ ██╔══██╗ ██╔══██╗ ██╔════╝ ██║  ██║
 ██║   ██║ ██████╔╝ █████╗   ██╔██╗ ██║ ███████╗ █████╗   ███████║ ██████╔╝ ██║      ███████║
 ██║   ██║ ██╔═══╝  ██╔══╝   ██║╚██╗██║ ╚════██║ ██╔══╝   ██╔══██║ ██╔══██╗ ██║      ██╔══██║
 ╚██████╔╝ ██║      ███████╗ ██║ ╚████║ ███████║ ███████╗ ██║  ██║ ██║  ██║ ╚██████╗ ██║  ██║
  ╚═════╝  ╚═╝      ╚══════╝ ╚═╝  ╚═══╝ ╚══════╝ ╚══════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝  ╚═════╝ ╚═╝  ╚═╝
```

An AI-powered research agent that conducts sophisticated multi-round web research with knowledge gap tracking, strategic query generation, and comprehensive answer synthesis.

**Created by [Kyle Mistele](https://blacklight.sh) ([@0xblacklight](https://x.com/0xblacklight))**

## 🚀 Overview

OpenSearch is an advanced AI research agent that mimics human research behavior by:

1. **Generating optimized search queries** from research topics
2. **Executing web searches** via Exa API to gather information  
3. **Reflecting on results** to identify knowledge gaps and assess sufficiency
4. **Iteratively searching** with strategic follow-up queries until comprehensive
5. **Synthesizing comprehensive answers** with proper citations and footnotes

### Key Features

- 🧠 **Multi-Round Research**: Sophisticated iterative workflow with knowledge gap tracking
- 🎯 **Strategic Query Generation**: AI generates diverse follow-up queries targeting specific gaps
- 🔄 **Concurrent Processing**: Parallel gap analysis and fact extraction for efficiency
- 📊 **Real-time Progress**: Interactive CLI with live updates for each research step
- 📚 **Context Optimization**: Intelligent fact extraction reduces token usage while preserving citations
- 🛡️ **Smart Abandonment**: Prevents infinite loops with 3-round rule and thoroughness assessment
- 🏗️ **Dual Architecture**: Both CLI for immediate use and Inngest workflows for production

## 🏗️ Architecture

OpenSearch implements **two parallel architectures** for different use cases:

### 1. CLI Application (`src/cli/`)
- **Interactive terminal interface** using React + Ink
- **Real-time progress visualization** for each research step
- **Event-driven architecture** with EventEmitter for UI updates
- **Direct BAML integration** for immediate AI function calls

### 2. Inngest Workflow (`src/inngest/`)
- **Scalable background processing** using Inngest functions
- **Real-time pub/sub** with channels for live updates
- **Workflow orchestration** with step functions and retry policies
- **Production-ready** with proper error handling and concurrency limits

## 📋 Research Workflow

```mermaid
flowchart TD
    Start([User Input: Research Topic]) --> InitQuery[Generate Initial Queries<br/>📝 GenerateQuery BAML Function<br/>- Create search queries<br/>- Generate query plan<br/>- Set research questions]
    
    InitQuery --> InitState[Initialize Agent State<br/>🔄 Round 1 of Max 10<br/>- Empty knowledge gap history<br/>- Track answered/unanswered questions<br/>- Initialize extracted facts array]
    
    InitState --> SearchExec[Execute Web Searches<br/>🔍 Parallel Exa API Calls<br/>- Rate limited (5 req/sec)<br/>- Full text + highlights<br/>- Generate unique IDs]
    
    SearchExec --> Reflect[Reflection Analysis<br/>🧠 Reflect BAML Function<br/>- Gap closure assessment<br/>- Question progress tracking<br/>- Identify relevant sources<br/>- Overall sufficiency check]
    
    Reflect --> CheckSufficient{Research<br/>Sufficient?}
    
    CheckSufficient -->|Yes| AnswerPath[Generate Final Answer]
    CheckSufficient -->|No| ConcurrentPhase[Concurrent Processing Phase]
    
    ConcurrentPhase --> GapAnalysis[Knowledge Gap Analysis<br/>🎯 AnalyzeKnowledgeGaps BAML<br/>- Review gap history<br/>- Apply abandonment criteria<br/>- Select next gap to research<br/>- Update gap statuses]
    
    ConcurrentPhase --> FactExtract[Fact Extraction<br/>📊 ExtractRelevantFacts BAML<br/>- Process relevant sources only<br/>- Extract concise facts<br/>- Maintain source attribution<br/>- Reduce context length]
    
    GapAnalysis --> ShouldContinue{Should Continue<br/>Research?}
    ShouldContinue -->|No - All gaps<br/>resolved/abandoned| AnswerPath
    
    ShouldContinue -->|Yes - Active gaps<br/>worth pursuing| FollowUpGen[Generate Follow-up Queries<br/>🔄 GenerateFollowUpQueries BAML<br/>- Target specific knowledge gap<br/>- Ensure query diversity<br/>- Avoid previous failed attempts<br/>- Strategic query angles]
    
    FollowUpGen --> UpdateState[Update Agent State<br/>📈 Increment Round Counter<br/>- Update gap history<br/>- Set current gap index<br/>- Track query attempts<br/>- Add extracted facts]
    
    UpdateState --> MaxRounds{Max Rounds<br/>Reached?}
    MaxRounds -->|Yes| ForceAnswer[Force Answer Generation<br/>⚠️ Max rounds reached<br/>Generate with available info]
    MaxRounds -->|No| SearchExec
    
    AnswerPath --> FactsAvailable{Extracted Facts<br/>Available?}
    FactsAvailable -->|Yes| CreateFromFacts[Create Answer from Facts<br/>📄 CreateAnswerFromFacts BAML<br/>- Use extracted facts<br/>- Maintain citations<br/>- Process footnotes]
    FactsAvailable -->|No| CreateFromResults[Create Answer from Results<br/>📄 CreateAnswer BAML<br/>- Use search results<br/>- Generate citations<br/>- Process footnotes]
    
    CreateFromFacts --> FinalAnswer[📋 Final Answer with Citations]
    CreateFromResults --> FinalAnswer
    ForceAnswer --> FinalAnswer
    
    %% Styling
    classDef bamlFunction fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef concurrent fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef endpoint fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef warning fill:#ffebee,stroke:#c62828,stroke-width:2px
    
    class InitQuery,Reflect,GapAnalysis,FactExtract,FollowUpGen,CreateFromFacts,CreateFromResults bamlFunction
    class ConcurrentPhase concurrent
    class CheckSufficient,ShouldContinue,MaxRounds,FactsAvailable decision
    class Start,FinalAnswer endpoint
    class ForceAnswer warning
```

## 🛠️ Installation & Setup

### Prerequisites

- [Bun](https://bun.sh) (Node.js runtime replacement)
- API keys for LLM providers and search services

### Environment Variables

Create a `.env` file with the required API keys:

```bash
EXA_API_KEY=your_exa_api_key              # Exa search API key
GOOGLE_API_KEY=your_google_api_key        # Google AI (Gemini) API key
ANTHROPIC_API_KEY=your_anthropic_key      # Anthropic (Claude) API key (optional)
OPENAI_API_KEY=your_openai_key            # OpenAI API key (optional)
INNGEST_BASE_URL=your_inngest_url         # Inngest endpoint (for workflow version)
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd opensearch

# Install dependencies
bun install

# Run the CLI
bun run cli
```

## 🎮 Usage

### CLI Commands

```bash
# Start interactive CLI with default settings (10 rounds max)
bun run cli

# Specify maximum research rounds
bun run cli --max-rounds 5
bun run cli --max-rounds 15

# Show help
bun run cli --help
```

### Development Commands

```bash
# Development mode with hot reloading
bun run dev

# Run tests
bun test

# Run specific test
bun test test/generate-query.test.ts

# Format and lint code
bunx biome format .
bunx biome lint .
```

### Example Research Session

```
Topic: "Compare fintech vs healthtech startup funding in 2024"

Round 1: General funding queries
├── 📝 Generated: "fintech startup funding 2024", "healthtech funding trends 2024"
├── 🔍 Executed 4 searches, found 12 relevant sources
└── 🧠 Reflection: Missing healthtech-specific data

Round 2: Healthtech-focused follow-up queries  
├── 📝 Generated: "digital health startup investments 2024", "biotech venture capital"
├── 🔍 Executed 3 searches, found 8 additional sources
└── 🧠 Reflection: Missing comparative analysis

Round 3: Comparative analysis queries
├── 📝 Generated: "fintech vs healthtech VC funding comparison 2024"
├── 🔍 Executed 2 searches, found 5 comparative sources
└── 📋 Final Answer: Comprehensive comparison with metrics and footnotes
```

## 🧠 BAML Integration

OpenSearch uses [BAML](https://docs.boundaryml.com/) (Basically A Made-Up Language) for structured AI function calls:

### Core Functions

- **`GenerateQuery`**: Transform research topics into optimized search queries + structured plans
- **`Reflect`**: Analyze search results for knowledge gap closure assessment  
- **`AnalyzeKnowledgeGaps`**: Strategic analysis of gap history and research continuation
- **`ExtractRelevantFacts`**: Extract concise facts from sources to reduce context length
- **`GenerateFollowUpQueries`**: Generate diverse queries targeting specific knowledge gaps
- **`CreateAnswer`/`CreateAnswerFromFacts`**: Synthesize comprehensive answers with citations

### LLM Clients

- **Primary**: Google AI (Gemini 2.5 Pro/Flash) - Fast and cost-effective  
- **Fallback**: OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet
- **Features**: Retry policies, exponential backoff, automatic failover

## 📁 Project Structure

```
opensearch/
├── src/cli/                    # CLI Application
│   ├── app.tsx                 # Main React component with UI orchestration
│   ├── agent.ts                # Core agent logic with EventEmitter
│   ├── components/             # UI Components
│   │   ├── research-input.tsx  # User input interface
│   │   ├── query-generation.tsx # Query generation display
│   │   ├── search-results.tsx  # Search execution progress
│   │   ├── reflection.tsx      # Analysis & knowledge gap display
│   │   ├── knowledge-gap-analysis.tsx # Gap analysis visualization
│   │   ├── followup-query-generation.tsx # Follow-up query display
│   │   ├── fact-extraction.tsx # Fact extraction progress
│   │   ├── final-answer.tsx    # Answer synthesis display
│   │   └── markdown-renderer.tsx # Markdown rendering with citations
│   ├── types.ts                # TypeScript types for workflow steps
│   └── index.tsx               # CLI entry point
├── src/inngest/                # Backend Workflow
│   ├── functions/
│   │   ├── deep-research.ts    # Main research orchestration function
│   │   ├── execute-searches.ts # Web search execution with rate limiting
│   │   └── index.ts            # Function exports
│   ├── client.ts               # Inngest client configuration
│   └── connection.ts           # Function registration
├── baml_src/                   # AI Function Definitions
│   ├── generate_query.baml     # Search query generation
│   ├── reflect.baml            # Result analysis & gap identification
│   ├── analyze_knowledge_gaps.baml # Strategic gap analysis
│   ├── extract_facts.baml      # Fact extraction from sources
│   ├── generate_followup_queries.baml # Follow-up query generation
│   ├── create_answer.baml      # Answer synthesis with citations
│   ├── types.baml              # Structured data schemas
│   ├── clients.baml            # LLM client configurations
│   └── generators.baml         # Code generation settings
├── baml_client/                # Auto-generated (DO NOT EDIT)
│   └── [generated TypeScript files]
└── src/utils.ts                # Shared utilities
```

## 🔧 Key Technologies

- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript runtime and package manager
- **UI Framework**: [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) - Terminal UI components
- **AI Integration**: [BAML](https://docs.boundaryml.com/) - Structured LLM function calls
- **Orchestration**: [Inngest](https://www.inngest.com/) - Serverless workflow engine
- **Search API**: [Exa](https://exa.ai/) - AI-powered web search
- **Language**: TypeScript with strict type checking
- **Formatting**: [Biome](https://biomejs.dev/) - Fast formatter and linter

## 🧪 Testing

### Test Coverage

- **BAML function tests**: Validate AI function calls with real APIs
- **Integration tests**: End-to-end workflow testing
- **Manual testing scripts**: Specific scenario validation

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test test/generate-query.test.ts

# Manual follow-up query testing
bun run scripts/test-follow-up-queries.ts
```

## 🔄 Advanced Features

### Knowledge Gap Tracking
- **Gap History**: Maintains status of all attempted research gaps
- **Smart Abandonment**: 3-round rule plus AI thoroughness assessment
- **Strategic Selection**: Prioritizes gaps addressing unanswered questions

### Concurrent Processing
- **Gap Analysis**: Strategic decisions about research continuation
- **Fact Extraction**: Context optimization while preserving citations  
- **Parallel Execution**: Improves overall research speed

### Query Diversity Strategy
- **Historical Awareness**: Analyzes previous queries to avoid repetition
- **Multi-angle Approach**: Different keywords, perspectives, specificity levels
- **Strategic Targeting**: Focuses on specific knowledge gaps

### Context Optimization
- **Before**: Accumulate full search result text (high token usage)
- **After**: Extract concise facts relevant to query plan (80-90% reduction)
- **Preservation**: Maintains source attribution for accurate citations

## 🚀 Production Deployment

### Rate Limiting
- **Exa API**: 5 requests/second (handled automatically)
- **LLM APIs**: Retry policies with exponential backoff
- **Concurrency**: Limited to 20 concurrent workflows

### Error Handling
- **Network failures**: Automatic retries with backoff
- **API limits**: Graceful degradation and queuing
- **Malformed responses**: Validation and fallbacks
- **Max rounds**: Prevents infinite loops

### Monitoring
- **Inngest dashboard**: Workflow execution monitoring
- **Step-by-step logging**: Detailed execution traces
- **Real-time channels**: Live progress updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes following the coding conventions
4. Run tests: `bun test`
5. Format code: `bunx biome format .`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [BAML](https://docs.boundaryml.com/) for structured AI interactions
- Powered by [Exa](https://exa.ai/) for intelligent web search
- UI built with [Ink](https://github.com/vadimdemedes/ink) terminal components
- Orchestrated with [Inngest](https://www.inngest.com/) workflows 