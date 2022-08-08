## Question Answering Handler

A custom question answering handler for 📣 stentor, a framework for building conversational applications. It requires a knowledge base to be setup as part of your conversational application

### What is 📣 stentor?

An Apache 2.0 licensed open source framework for building conversational applications. It supports a variety of channels, NLU, and is extensible by creating custom handlers.

### What is Question Answering?

Question Answering is a Natural Language Processing (NLP) field that focuses on answering questions from a corpus of documents.

### Media Support

Answers found in audio and video files are now supported.  The content of media is transcribed and indexed like text documents.  Search results supply the timestamp in the media where it will be played at that location in the media content.  To add media as a source, please do the following:

1.  Add this [Cloudformation script](https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=https://s3.us-east-1.amazonaws.com/aws-ml-blog/artifacts/mediasearch/msindexer.yaml&stackName=MediaSearch-Indexer) to your Kendra Index.
2.  Add this [custom media component](https://github.com/xapp-ai/oc-playground/tree/main/packages/custom-components) to your client.
