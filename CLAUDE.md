# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
yarn build      # Compile TypeScript to lib/
yarn test       # Run all tests
yarn lint       # Run ESLint
yarn clean      # Remove lib/ directory
```

Run a single test file:
```bash
yarn mocha --recursive -r ts-node/register "./src/__test__/focusAnswer.test.ts"
```

## Architecture

This is a question answering handler for the **stentor** conversational AI framework. It processes knowledge base results and generates appropriate responses.

### Core Flow

1. **QuestionAnsweringHandler** (`QuestionAnsweringHandler.ts`) - Extends `AbstractHandler` from stentor. On request:
   - Retrieves `KnowledgeBaseResult` from session storage (key: `knowledge_base_result`)
   - Calls `generateResultVariables()` to process results into typed variables
   - Sets variables on both session and request attributes
   - Returns default or custom responses based on available data

2. **generateResultVariables** (`generateResultVariables.ts`) - The main processing function that transforms knowledge base results into structured variables:
   - `TOP_FAQ` - Best FAQ match (uses Fuse.js fuzzy matching)
   - `TOP_ANSWER` - High-confidence concise answer
   - `SUGGESTED_ANSWER` - Answer with more context
   - `RAG_RESULT` - Retrieval-augmented generation result
   - `GENERAL_KNOWLEDGE` - LLM general knowledge answer
   - `CHAT_RESPONSE` - Chat strategy response
   - `SEARCH_RESULTS` - List of document results
   - `GENERATED_NO_ANSWER` - Generated no-answer response

3. **Response Selection** - Default responses in `constants.ts` use conditional expressions to select the most appropriate response type based on available variables.

### Key Utilities

- **focusAnswer** - Trims answer text to focus on highlighted portions
- **cleanAnswer** - Sanitizes answer text
- **generateTextFragmentURL** - Creates URLs with text fragment anchors
- **question.ts** - Uses `compromise` NLP library to detect questions

### Configuration Options (QuestionAnsweringData)

- `FUZZY_MATCH_FAQS` - Enable/configure FAQ fuzzy matching threshold
- `MIN_FAQ_MATCH_CONFIDENCE` - Minimum confidence for FAQ matches
- `QNA_BOT_LONGEST_HIGHLIGHT` - Use longest highlight as top answer (QnABot strategy)
- `REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS` - Focus answer by removing leading context
- `REMOVE_TRAILING_LINES_WITHOUT_HIGHLIGHTS` - Focus answer by removing trailing context

### Dependencies

- **stentor-*** - Peer dependencies from the stentor framework
- **fuse.js** - Fuzzy string matching for FAQ matching
- **compromise** - NLP for question detection
- **linkifyjs** - URL detection for highlight handling

## Code Standards

- All source files require XAPP AI copyright header: `/*! Copyright (c) <YEAR>, XAPP AI */`
- Explicit return types required on functions (except test files)
- Tests located in `src/__test__/` directory
