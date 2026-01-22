/*! Copyright (c) 2023, XAPP AI */
import { existsAndNotEmpty } from "stentor-utils";
import type { Context, Request, Response, List, ListItem, SuggestionTypes } from "stentor-models";

import type { QuestionAnsweringData } from "./QuestionAnsweringHandler";
import { isResultVariableFAQInformation, isResultVariableGeneratedInformation } from "./guards";
import type { ResultVariableInformation, ResultVariableFAQInformation, ResultVariableListItem, ResultVariableGeneratedInformation } from "./models";
import { lastSentenceIsQuestion, popLastQuestion } from "./question";

export interface GenerateListOptions {
    /**
     * Title of the list, defaults to "Results"
     */
    title?: string;
    /**
     * If true, the description will be included for list items with links.  By default it is omitted.
     */
    includeDescriptionForLinks?: boolean;
}

/**
 * Converts a search results to a List display
 */
function generateList(search: (ResultVariableListItem | ResultVariableFAQInformation)[], total: number, options: GenerateListOptions): List {

    const title = options?.title || "Results";
    const includeDescriptionForLinks = typeof options?.includeDescriptionForLinks === "boolean" ? options.includeDescriptionForLinks : false;

    const items: ListItem[] = search.slice(0, total).map((result, index) => {

        const title: string = isResultVariableFAQInformation(result) ? (result.question || "FAQ") : result.title;

        const description: string = isResultVariableFAQInformation(result) ? result.text : result.document;

        const item: ListItem = {
            token: `result-${index}`,
            title
        };

        if (result.source) {
            item.url = result.source

            if (includeDescriptionForLinks) {
                item.description = description;
            }
        } else if (description) {
            item.description = description;
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

    if (!request.attributes) {
        // just so the following doesn't crash
        request.attributes = {};
    }

    const GENERATED_NO_ANSWER: ResultVariableInformation = request.attributes['GENERATED_NO_ANSWER'];

    //  Search Results
    const SEARCH: ResultVariableListItem[] = Array.isArray(request.attributes["SEARCH_RESULTS"]) ? request.attributes["SEARCH_RESULTS"] : [];

    // TOP_FAQ
    const TOP_FAQ: ResultVariableFAQInformation = request.attributes["TOP_FAQ"];

    const FAQS: ResultVariableFAQInformation[] = Array.isArray(request.attributes["FAQS"]) ? request.attributes["FAQS"] : [];

    // Suggested
    const SUGGESTED: ResultVariableInformation = request.attributes["SUGGESTED_ANSWER"];

    // General Knowledge
    const GENERAL_KNOWLEDGE: ResultVariableInformation = request.attributes["GENERAL_KNOWLEDGE"];

    // Chat Responses
    const CHAT_RESPONSE: ResultVariableGeneratedInformation = request.attributes["CHAT_RESPONSE"] || request.attributes["CHAT_ANSWER"];

    // Top Answer / RAG / Chat Answer
    const AI_ANSWER: ResultVariableGeneratedInformation | ResultVariableInformation = request.attributes["RAG_RESULT"] || CHAT_RESPONSE || request.attributes["TOP_ANSWER"];

    let label: string;
    let displayAnswer: string;
    let ssmlAnswer: string;
    let tag: string;
    const suggestions: SuggestionTypes[] = [];

    if (channel === "intelligent-search") {
        const { topLabels, numberOfResults } = data?.search || {};

        // no reprompt on intelligent-search
        delete response.reprompt;

        if (TOP_FAQ) {
            label = topLabels?.FAQ || "FAQ";
            displayAnswer = `${TOP_FAQ.markdownText}`
            ssmlAnswer = `${TOP_FAQ.text}`;
            tag = `KB_TOP_FAQ`;
            if (TOP_FAQ.source) {
                suggestions.push({
                    title: "Read More",
                    url: TOP_FAQ.source
                });
            }

        } else if (AI_ANSWER) {
            label = topLabels?.AI_ANSWER || "AI Answer";
            displayAnswer = `${AI_ANSWER.markdownText}`
            ssmlAnswer = `${AI_ANSWER.text}`;
            tag = !!request.attributes["RAG_RESULT"] ? `KB_RAG` : `KB_TOP_ANSWER`;
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
                            title: source.title || `Source ${index + 1}`,
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
        }

        if (displayAnswer) {
            response.outputSpeech = {
                displayText: `__${label}__\n${displayAnswer}`,
                ssml: `<speak>${ssmlAnswer}</speak>`,
                suggestions
            }
            response.tag = tag;
        }

        if (existsAndNotEmpty(SEARCH) || existsAndNotEmpty(FAQS)) {

            const trimTo: number = typeof numberOfResults === "number" && numberOfResults > 0 ? numberOfResults : 6;

            // combine the lists
            const combined = (FAQS || []).slice(0, 3).concat(SEARCH || []);
            // add them, with a title and trimmed to 6
            response.displays.push(generateList(combined, trimTo, { title: "Top Results", includeDescriptionForLinks: true }));

            if (!tag) {
                response.tag = "KB_LIST_OF_RESULTS";
            }
        }
        // No answer scenario, no displayAnswer and no list of results

        if (!displayAnswer && !existsAndNotEmpty(SEARCH) && !existsAndNotEmpty(FAQS)) {
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

        const scheduleButton = data?.chat?.scheduleButton;

        const includeResultsInNoAnswer: number = data?.chat?.includeResultsInNoAnswer;

        const followUp = typeof data?.chat?.followUp === "string" ? data.chat.followUp : "Any other questions?";

        if (TOP_FAQ) {
            displayAnswer = `${TOP_FAQ.markdownText}\n\n${followUp}`
            ssmlAnswer = `${TOP_FAQ.text} ${followUp}`;
            tag = `KB_TOP_FAQ`;
            if (TOP_FAQ.source) {
                suggestions.push({
                    title: "Read More",
                    url: TOP_FAQ.source
                });
            }
        } else if (AI_ANSWER) {
            // can we check to see if there is a follow up question already in the AI_ANSWER and then selectively add the follow up?
            if (lastSentenceIsQuestion(AI_ANSWER.text)) {

                // split the text into sentences
                const [, lastQuestion] = popLastQuestion(AI_ANSWER.text);
                // if we can accurately pull the question out, it looks better if we split it up for the user to see
                if (lastQuestion) {
                    // remove the last question from the markdown text
                    // then append the last question to the end of the display answer after two new lines
                    displayAnswer = `${AI_ANSWER.markdownText.replace(lastQuestion, "").trim()}\n\n${lastQuestion}`;
                } else {
                    displayAnswer = `${AI_ANSWER.markdownText}`;
                }

                ssmlAnswer = `${AI_ANSWER.text}`;
            } else {
                // doesn't have a question, so we don't need to add the follow up
                displayAnswer = `${AI_ANSWER.markdownText}\n\n${followUp}`;
                ssmlAnswer = `${AI_ANSWER.text} ${followUp}`;
            }

            tag = !!request.attributes["RAG_RESULT"] ? `KB_RAG` : `KB_TOP_ANSWER`;

            const hasRAG = !!request.attributes["RAG_RESULT"];
            const hasChat = !!request.attributes["CHAT_RESPONSE"];

            if (hasRAG) {
                tag = `KB_RAG`;
            } else if (hasChat) {
                tag = `KB_CHAT_RESPONSE`;
            } else {
                tag = `KB_TOP_ANSWER`;
            }

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
                            title: source.title || `Source ${index + 1}`,
                            url: source.url
                        });
                    }
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
        } else if (SUGGESTED && !voiceDevice && !AI_ANSWER) {
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
                response.displays.push(generateList(SEARCH, includeResultsInNoAnswer, { title: "Top Results", includeDescriptionForLinks: false }));
            }
        } else if ((existsAndNotEmpty(SEARCH) || existsAndNotEmpty(FAQS)) && !voiceDevice) {
            displayAnswer = `See if below will help answer your question. ${followUp}`
            ssmlAnswer = `See if below will help answer your question. ${followUp}`;
            tag = `KB_LIST_OF_RESULTS`;
            // include at least one FAQ
            const combined = (FAQS || []).slice(0, 1).concat(SEARCH || []);
            response.displays.push(generateList(combined, 3, { includeDescriptionForLinks: false }));
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

            // Add schedule button display if configured
            if (scheduleButton) {
                response.displays.push({
                    type: "ScheduleButton",
                    title: scheduleButton.title || "Schedule Service"
                });
            }
        }
    }

    return response;
}