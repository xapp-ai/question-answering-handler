/*! Copyright (c) 2023, XAPP AI */
import { Context, Request, Response, existsAndNotEmpty, List, ListItem } from "stentor";
import { SuggestionObjectTypes } from "stentor-models";

import { QuestionAnsweringData } from "./QuestionAnsweringHandler";
import { isResultVariableGeneratedInformation } from "./guards";
import { ResultVariableInformation, ResultVariableFAQInformation, ResultVariableListItem, ResultVariableGeneratedInformation } from "./models";

/**
 * Converts a search results to a List display
 */
function generateList(search: ResultVariableListItem[], total: number, title?: string): List {

    const items: ListItem[] = search.slice(0, total).map((result, index) => {
        const item: ListItem = {
            token: `result-${index}`,
            title: `${result.title}`,
            description: `${result.document}`
        };
        if (result.source) {
            item.url = result.source
        }

        return item;
    });

    return {
        type: "LIST",
        title: title || "Results",
        items
    };
}

/**
 * Generates default response based on the request and the context.
 * 
 * @param request 
 * @param context 
 * @param data 
 * @returns 
 */
export function generateDefaultResponse(request: Request, context: Context, data: Pick<QuestionAnsweringData, "chat" | "search">): Response {

    const response: Response = {
        outputSpeech: {
            displayText: "",
            ssml: "",
            suggestions: []
        },
        reprompt: {
            displayText: "",
            ssml: ""
        },
        displays: []
    }

    // We want to know the channel
    const channel: string = request.channel;


    const GENERATED_NO_ANSWER: ResultVariableInformation = context.session.get('GENERATED_NO_ANSWER');

    //  Search Results
    const SEARCH: ResultVariableListItem[] = context.session.get("SEARCH_RESULTS")

    // FAQ
    const FAQ: ResultVariableFAQInformation = context.session.get("TOP_FAQ");

    // Suggested
    const SUGGESTED: ResultVariableInformation = context.session.get("SUGGESTED_ANSWER");

    // General Knowledge
    const GENERAL_KNOWLEDGE: ResultVariableInformation = context.session.get("GENERAL_KNOWLEDGE");

    // Top Answer / RAG
    const AI_ANSWER: ResultVariableGeneratedInformation | ResultVariableInformation = context.session.get("RAG_RESULT") || context.session.get("TOP_ANSWER");

    let label: string;
    let displayAnswer: string;
    let ssmlAnswer: string;
    let tag: string;
    const suggestions: SuggestionObjectTypes[] = [];

    if (channel === "intelligent-search") {

        const { topLabels, numberOfResults } = data?.search || {};

        // no reprompt on intelligent-search
        delete response.reprompt;

        if (AI_ANSWER) {
            label = topLabels?.AI_ANSWER || "AI Answer";
            displayAnswer = `${AI_ANSWER.markdownText}`
            ssmlAnswer = `${AI_ANSWER.text}`;
            tag = !!context.session.get("RAG_RESULT") ? `KB_RAG` : `KB_TOP_ANSWER`;
            if (AI_ANSWER.source) {
                suggestions.push({
                    title: "Read More",
                    url: AI_ANSWER.source
                });
            }
            if (isResultVariableGeneratedInformation(AI_ANSWER)) {
                AI_ANSWER.sources.forEach((source, index) => {
                    if (source.url) {
                        suggestions.push({
                            title: `Source ${index + 1}`,
                            url: source.url
                        });
                    }
                });
            }
        } else if (GENERAL_KNOWLEDGE) {
            label = topLabels?.GENERAL_KNOWLEDGE || "General Knowledge";
            displayAnswer = `${GENERAL_KNOWLEDGE.markdownText}`
            ssmlAnswer = `${GENERAL_KNOWLEDGE.text}`;
            tag = `KB_GENERAL_KNOWLEDGE`;
            if (GENERAL_KNOWLEDGE.source) {
                suggestions.push({
                    title: "Read More",
                    url: GENERAL_KNOWLEDGE.source
                });
            }
        } else if (SUGGESTED) {
            label = topLabels?.SUGGESTED || "Suggested Answer";
            displayAnswer = `${SUGGESTED.markdownText}`
            ssmlAnswer = `${SUGGESTED.text}`;
            tag = `KB_SUGGESTED_ANSWER`;

            if (SUGGESTED.source) {
                suggestions.push({
                    title: "Read More",
                    url: SUGGESTED.source
                });
            }
        } else if (FAQ) {
            label = topLabels?.FAQ || "FAQ";
            displayAnswer = `${FAQ.markdownText}`
            ssmlAnswer = `${FAQ.text}`;
            tag = `KB_TOP_FAQ`;
            if (FAQ.source) {
                suggestions.push({
                    title: "Read More",
                    url: FAQ.source
                });
            }
        }

        if (displayAnswer) {
            response.outputSpeech = {
                displayText: `__${label}__\n${displayAnswer}`,
                ssml: `<speak>${ssmlAnswer}</speak>`,
                suggestions
            }
            response.tag = tag;
        }

        if (existsAndNotEmpty(SEARCH)) {

            const trimTo: number = typeof numberOfResults === "number" && numberOfResults > 0 ? numberOfResults : 6

            response.displays.push(generateList(SEARCH, trimTo));

            if (!tag) {
                response.tag = "KB_LIST_OF_RESULTS";
            }
        }
        // No answer scenario, no displayAnswer and no list of results

        if (!displayAnswer && !existsAndNotEmpty(SEARCH)) {
            // Nothing at all
            response.outputSpeech = {
                displayText: `No Results`,
                ssml: `<speak>No Results</speak>`
            }
            response.tag = "KB_NO_ANSWER";
        }

    } else {
        /**
         * DEFAULT PATH
         * 
         * -- For chat widget, console, google business messages
         * -- NOTE: We also check for voice devices and for those, we will NOT display lists
         */

        const voiceDevice = request?.device?.canSpeak;

        const suggestionChips = data?.chat?.suggestionChips || [];

        const includeResultsInNoAnswer: number = data?.chat?.includeResultsInNoAnswer;

        const followUp = typeof data?.chat?.followUp === "string" ? data.chat.followUp : "Any other questions?";

        if (AI_ANSWER) {
            displayAnswer = `${AI_ANSWER.markdownText}\n\n${followUp}`;
            ssmlAnswer = `${AI_ANSWER.text} ${followUp}`;
            tag = !!context.session.get("RAG_RESULT") ? `KB_RAG` : `KB_TOP_ANSWER`;
            if (AI_ANSWER.source) {
                suggestions.push({
                    title: "Read More",
                    url: AI_ANSWER.source
                });
            }
            if (isResultVariableGeneratedInformation(AI_ANSWER)) {
                AI_ANSWER.sources.forEach((source, index) => {
                    if (source.url) {
                        suggestions.push({
                            title: `Source ${index + 1}`,
                            url: source.url
                        });
                    }
                });
            }

        } else if (FAQ) {
            displayAnswer = `${FAQ.markdownText}\n\n${followUp}`
            ssmlAnswer = `${FAQ.text} ${followUp}`;
            tag = `KB_TOP_FAQ`;
            if (FAQ.source) {
                suggestions.push({
                    title: "Read More",
                    url: FAQ.source
                });
            }
        } else if (GENERAL_KNOWLEDGE) {
            displayAnswer = `${GENERAL_KNOWLEDGE.markdownText}\n\n${followUp}`
            ssmlAnswer = `${GENERAL_KNOWLEDGE.text} ${followUp}`;
            tag = `KB_GENERAL_KNOWLEDGE`;
            if (GENERAL_KNOWLEDGE.source) {
                suggestions.push({
                    title: "Read More",
                    url: GENERAL_KNOWLEDGE.source
                });
            }
        } else if (SUGGESTED && !voiceDevice) {
            displayAnswer = `Here is what I found...\n"${SUGGESTED.markdownText}"\n\n${followUp}`
            ssmlAnswer = `${SUGGESTED.text} ${followUp}`;
            tag = `KB_SUGGESTED_ANSWER`;
            if (SUGGESTED.source) {
                suggestions.push({
                    title: "Read More",
                    url: SUGGESTED.source
                });
            }
        } else if (GENERATED_NO_ANSWER) {
            displayAnswer = `${GENERATED_NO_ANSWER.markdownText}\n\n${followUp}`
            ssmlAnswer = `${GENERATED_NO_ANSWER.text} ${followUp}`;
            tag = `KB_GENERATED_NO_ANSWER`;

            // two possibilities here, if we have search or not
            if (existsAndNotEmpty(SEARCH) && !voiceDevice && typeof includeResultsInNoAnswer === "number") {
                response.displays.push(generateList(SEARCH, includeResultsInNoAnswer, "Top Results"));
            }
        } else if (existsAndNotEmpty(SEARCH) && !voiceDevice) {
            displayAnswer = `See if below will help answer your question. ${followUp}`
            ssmlAnswer = `See if below will help answer your question. ${followUp}`;
            tag = `KB_LIST_OF_RESULTS`;
            response.displays.push(generateList(SEARCH, 3));
        } else {
            displayAnswer = `I'm sorry, I don't know that one. ${followUp}`
            ssmlAnswer = `I'm sorry, I don't know that one. ${followUp}`;
            tag = `KB_NO_ANSWER`;
        }

        if (displayAnswer) {
            // Add the suggestions
            suggestions.push(...suggestionChips);
            response.outputSpeech = {
                displayText: displayAnswer.trim(),
                ssml: `<speak>${ssmlAnswer.trim()}</speak>`,
                suggestions
            }

            response.reprompt = {
                displayText: `${followUp}`,
                ssml: `<speak>${followUp}</speak>`
            }

            response.tag = tag;
        }
    }

    return response;
}