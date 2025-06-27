
  ██████╗  ██████╗  ███████╗ ███╗   ██╗ ███████╗ ███████╗  █████╗  ██████╗   ██████╗ ██╗  ██╗
 ██╔═══██╗ ██╔══██╗ ██╔════╝ ████╗  ██║ ██╔════╝ ██╔════╝ ██╔══██╗ ██╔══██╗ ██╔════╝ ██║  ██║
 ██║   ██║ ██████╔╝ █████╗   ██╔██╗ ██║ ███████╗ █████╗   ███████║ ██████╔╝ ██║      ███████║
 ██║   ██║ ██╔═══╝  ██╔══╝   ██║╚██╗██║ ╚════██║ ██╔══╝   ██╔══██║ ██╔══██╗ ██║      ██╔══██║
 ╚██████╔╝ ██║      ███████╗ ██║ ╚████║ ███████║ ███████╗ ██║  ██║ ██║  ██║ ╚██████╗ ██║  ██║
  ╚═════╝  ╚═╝      ╚══════╝ ╚═╝  ╚═══╝ ╚══════╝ ╚══════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝  ╚═════╝ ╚═╝  ╚═╝

An interactive command-line interface for the deep research agent workflow built with [Ink](https://github.com/vadimdemedes/ink) by [Kyle Mistele](blacklight.sh) [@0xblacklight](https://x.com/0xblacklight)

## Features

- **Interactive Input**: Enter your research topic via text input
- **Query Generation**: Watch as AI generates optimized search queries
- **Live Search Progress**: See searches being executed in real-time
- **Reflection Analysis**: AI analyzes results and identifies knowledge gaps
- **Iterative Research**: Automatically generates follow-up queries when needed
- **Final Answer**: Comprehensive answer synthesis from all gathered information

## Usage

Run the CLI:

```bash
bun run cli
```

## Workflow

1. **Input**: Enter your research topic
2. **Query Generation**: AI generates search queries using BAML GenerateQuery function
3. **Web Search**: Executes searches (currently mocked, integrate with your web search service)
4. **Reflection**: AI analyzes results using BAML Reflect function to identify knowledge gaps
5. **Iteration**: If gaps exist, generates follow-up queries and repeats
6. **Final Answer**: Uses BAML CreateAnswer function to synthesize comprehensive response

## Components

- `research-input.tsx` - Text input for research topic
- `query-generation.tsx` - Shows query generation process
- `search-results.tsx` - Displays search execution progress
- `reflection.tsx` - Shows reflection analysis and knowledge gap identification
- `final-answer.tsx` - Generates and displays final comprehensive answer

## Integration Points

The CLI is designed to integrate with your orchestration system:

- **BAML Functions**: Calls actual BAML functions (GenerateQuery, Reflect, CreateAnswer)
- **Web Search Service**: Replace mock search implementation with your web search service
- **Error Handling**: Graceful fallbacks when BAML functions fail

## Architecture

- Built with React and Ink for terminal UI
- Uses BAML client (`@baml-client`) for AI function calls
- Follows the iterative research workflow from your diagram
- State management handles complex multi-step workflow
- Progress indicators for each step 