## Question Answering Handler

A custom question answering handler for 📣 stentor, a framework for building conversational applications. It requires a knowledge base to be setup as part of your conversational application

### What is 📣 stentor?

An Apache 2.0 licensed open source framework for building conversational applications. It supports a variety of channels, NLU, and is extensible by creating custom handlers.

### What is Question Answering?

Question Answering is a Natural Language Processing (NLP) field that focuses on answering questions from a corpus of documents.


### How it works?

Stentor will store all knowledgebase results on the session storage on the key `knowledge_base_result`.  QuestionAnsweringHandler will then generate additional keys on the session from these results:

__No Answer__

A no answer is used when zero results exist from the knowledgebase.

Tags: `KB_NO_ANSWER`

__AI Generated response for No Knowing__

`GENERATED_NO_ANSWER` - We leverage generative AI to produce a no answer response.

Tags: `KB_GENERATED_NO_ANSWER`

__List of Search Results__

`SEARCH_RESULTS` - A list of search results typically based on keyword search

Tags: `KB_LIST_OF_RESULTS`

__Possible Answer from Own Content__

`SUGGESTED_ANSWER` - A possible answer from source text.

Tags: `KB_SUGGESTED_ANSWER`

__Best Answer from the LLM's General Knowledge__

`GENERAL_KNOWLEDGE` - An answer from general knowledge of the generative' AIs large language model.

Tags: `KB_GENERAL_KNOWLEDGE`

__AI Answer from Owned Content__

`RAG_RESULT` - AI Generated from search results
`TOP_ANSWER` - AI determined, these are pulled directly from the source material and are not generated.

Tags: `KB_RAG` & `KB_TOP_ANSWER`

__Best Curated Answer__

`TOP_FAQ` - A top match within FAQs that have a human written, curated answer.  Determined by match confidence score or fuzzy matching.

Tags: `KB_TOP_FAQ`
