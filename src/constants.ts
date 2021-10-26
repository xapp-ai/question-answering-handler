/*! Copyright (c) 2021, XAPP AI */
import { Response } from "stentor";






export const DEFAULT_SUGGESTED_ANSWER_RESPONSE: Response = {
    outputSpeech: {
        displayText: "",
        ssml: ""
    },
    reprompt: {
        displayText: "",
        ssml: ""
    },
    conditions: ""
}

export const DEFAULT_ANSWER_SNIPPET_RESPONSE: Response = {
    outputSpeech: {
        displayText: "",
        ssml: ""
    },
    reprompt: {
        displayText: "",
        ssml: ""
    }
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
