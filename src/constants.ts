/*! Copyright (c) 2021, XAPP AI */
import { Response } from "stentor";

export const DEFAULT_TOP_FAQ_RESPONSE: Response = {
    outputSpeech: {
        displayText: "${TOP_FAQ.markdownText}\n\nAny other questions?",
        ssml: "<speak>${TOP_FAQ.text} Any other questions?</speak>",
        suggestions: [
            { title: "Read More", url: "${TOP_FAQ.source}" }
        ]
    },
    reprompt: {
        displayText: "Any other questions?",
        ssml: "<speak>Any other questions?</speak>"
    },
    conditions: "!!session('TOP_FAQ')"
}

export const DEFAULT_TOP_ANSWER_RESPONSE: Response = {
    outputSpeech: {
        displayText: "${TOP_ANSWER.markdownText}\n\nAny other questions?",
        ssml: "<speak>${TOP_ANSWER.text} Any other questions?</speak>",
        suggestions: [
            { title: "Read More", url: "${TOP_ANSWER.source}" }
        ]
    },
    reprompt: {
        displayText: "Any other questions?",
        ssml: "<speak>Any other questions?</speak>"
    },
    conditions: "!!session('TOP_ANSWER') && !session('TOP_FAQ')"
}

// This is used for SUGGESTED_ANSWER
export const DEFAULT_SUGGESTED_ANSWER_RESPONSE: Response = {
    outputSpeech: {
        displayText: "Here is what I found...\n\"${SUGGESTED_ANSWER.markdownText}\"\nAny other questions?",
        ssml: "<speak>Here is what I found...${SUGGESTED_ANSWER.markdownText}  Any other questions?</speak>",
        suggestions: [
            { title: "Read More", url: "${SUGGESTED_ANSWER.source}" }
        ]
    },
    reprompt: {
        displayText: "Any other questions?",
        ssml: "<speak>Any other questions?</speak>"
    },
    conditions: "!${$.request.device.canSpeak} && !!session('SUGGESTED_ANSWER') && !session('TOP_ANSWER') && !session('TOP_FAQ')"
}

// This is used for RESULTS
export const DEFAULT_SEARCH_RESULTS_RESPONSE: Response = {
    outputSpeech: {
        displayText: "Here is what I found...",
        ssml: "<speak>Here is what I found...</speak>"
    },
    reprompt: {
        displayText: "Any other questions?",
        ssml: "<speak>Any other questions?</speak>"
    },
    displays: [
        {
            type: "LIST",
            itemsName: "currentResult",
            itemsObject: "${SEARCH_RESULTS}",
            range: {
                length: 3,
                from: 0
            },
            title: "${$.request.rawQuery}",
            items: [
                {
                    title: "${currentResult.title}",
                    description: "${currentResult.document}",
                    token: "result-${index}",
                    url: "${currentResult.source}",
                    synonyms: []
                }
            ]
        }
    ],
    conditions: "!${$.request.device.canSpeak} && !!session('SEARCH_RESULTS') && !session('SUGGESTED_ANSWER') && !session('TOP_ANSWER') && !session('TOP_FAQ')"
}

export const DEFAULT_UNKNOWN_RESPONSE: Response = {
    outputSpeech: {
        displayText: "I'm sorry, I don't know that one. What else can I help you with?",
        ssml: "<speak>I'm sorry, I don't know that one. What else can I help you with?</speak>"
    },
    reprompt: {
        displayText: "What else can I help you with?",
        ssml: "What else can I help you with?"
    }
};

export const DEFAULT_RESPONSES: Response[] = [
    DEFAULT_TOP_FAQ_RESPONSE,
    DEFAULT_TOP_ANSWER_RESPONSE,
    DEFAULT_SUGGESTED_ANSWER_RESPONSE,
    DEFAULT_SEARCH_RESULTS_RESPONSE,
    DEFAULT_UNKNOWN_RESPONSE
];

export const QUESTION_ANSWERING_HANDLER_TYPE = "QuestionAnsweringHandlerType";