/*! Copyright (c) 2021, XAPP AI */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Fuse = require('fuse.js');

import { log } from "stentor-logger";
import { KnowledgeBaseDocument, KnowledgeBaseFAQ, KnowledgeBaseResult } from "stentor-models";
import { existsAndNotEmpty } from "stentor-utils";

import { cleanAnswer } from "./cleanAnswer";
import { focusAnswer, FocusConfig } from "./focusAnswer";
import { generateTextFragmentURL } from "./generateTextFragmentURL";
import { ResultVariableInformation, ResultVariableGeneratedInformation, ResultVariableFAQInformation, ResultVariableListItem } from "./models";
import { mergeIntervals, longestInterval, addMarkdownHighlights } from "./utils";
import { isQuestion } from "./question";

export interface ResultVariablesConfig extends FocusConfig {
    /**
     * If true, it will attempt to use fuzzy string matching to return the top FAQ
     */
    ["FUZZY_MATCH_FAQS"]?: boolean | number;
    /**
     * If true, it will use the longest highlight as the TOP ANSWER if no top answer is provided.
     * 
     * This is a strategy QnABot uses: https://github.com/aws-solutions/aws-qnabot/blob/aaef24ac610bb5f0324326c92914bda21bccef57/lambda/es-proxy-layer/lib/kendra.js#L383
     */
    ["QNA_BOT_LONGEST_HIGHLIGHT"]?: boolean;
    /**
     * Sometimes the highlights in the FAQ are not great so they are off by default.
     */
    ["HIGHLIGHT_TOP_FAQ"]?: boolean;
}

export interface ResultVariables {
    /**
     * A high confidence, typically concise, answer
     */
    TOP_ANSWER?: ResultVariableInformation;
    /**
     * A suggested answer, typically with more source material than the TOP_ANSWER for additional context since the confidence
     * is not as high as the TOP_ANSWER.
     */
    SUGGESTED_ANSWER?: ResultVariableInformation;
    /**
     * FAQ that most matches 
     */
    TOP_FAQ?: ResultVariableFAQInformation;
    /**
     * Possible FAQs that match the query.
     */
    FAQS?: ResultVariableFAQInformation[];
    /**
     * List of search results.  These are typically the fallback when a suggestions, top answer or top FAQ
     * are not found.
     */
    SEARCH_RESULTS?: ResultVariableListItem[];
    /**
     * A generated result using retrieval augmented generation
     */
    RAG_RESULT?: ResultVariableGeneratedInformation;
    /**
     * A generated result from the general knowledge of a large language model
     */
    GENERAL_KNOWLEDGE?: ResultVariableInformation;
    /**
     * A generated result that does not have an answer but has a response.
     */
    GENERATED_NO_ANSWER?: ResultVariableInformation;
    /**
     * From the Chat Strategy of X-NLU.  This is the response to the user's query.  This is much more common than CHAT_ANSWER.
     */
    CHAT_RESPONSE?: ResultVariableGeneratedInformation;
    /**
     * If the original query from the user is a question.
     */
    IS_QUESTION?: boolean;
}

/**
 * From the provided query and results, it turns the results into a set of variables
 * that can then be injected into responses.
 */
export function generateResultVariables(query: string | undefined, result: KnowledgeBaseResult | undefined, config: ResultVariablesConfig): ResultVariables {

    if (!query || !result) {
        log().warn(`Unable to generate result variables: ${query || 'Query was undefined.'} ${result || 'Result was undefined'}`);
        return {}
    }

    // make a copy for good riddance
    result = { ...result };

    const { FUZZY_MATCH_FAQS, QNA_BOT_LONGEST_HIGHLIGHT, HIGHLIGHT_TOP_FAQ } = config || {};

    // Get possible FAQ matches
    let topFAQ: KnowledgeBaseFAQ = undefined;

    // Try to find the top FAQ match

    if (existsAndNotEmpty(result.faqs)) {

        // First method, determine if there is a matchConfidence on the FAQ and sort by those

        const firstFaq = result.faqs[0];

        if (typeof firstFaq.matchConfidence === "number" && firstFaq.matchConfidence > 0) {

            // Sort by matchConfidence and select the top one as the topFAQ
            result.faqs.sort((a, b) => b.matchConfidence - a.matchConfidence);

            topFAQ = result.faqs[0];
        } else {
            // attempt to fuzzy match
            const faqs: KnowledgeBaseFAQ[] = result.faqs;
            const threshold: number = typeof FUZZY_MATCH_FAQS === "number" ? FUZZY_MATCH_FAQS : 0.3;
            // fuzzy string matching on the question, comparing to the query
            const fuse = new Fuse(faqs, { threshold, includeScore: true, keys: ["question"] });

            const results: { item: KnowledgeBaseFAQ }[] = fuse.search(query);

            const possibleFaqs: KnowledgeBaseFAQ[] = results.map((result => result.item));

            if (possibleFaqs.length > 0) {
                topFAQ = possibleFaqs[0];
            }
        }
    }

    const variables: ResultVariables = {
        IS_QUESTION: isQuestion(query)
    };

    if (topFAQ) {

        const text = cleanAnswer(topFAQ.document);

        const markdownText: string = HIGHLIGHT_TOP_FAQ ? cleanAnswer(addMarkdownHighlights(topFAQ.document, topFAQ.highlights)) : text;

        variables.TOP_FAQ = {
            text,
            markdownText,
            source: generateTextFragmentURL(topFAQ.uri, topFAQ.document),
            handlerId: topFAQ.handlerId
        }
    }

    // Add FAQs
    if (existsAndNotEmpty(result.faqs)) {
        const faqs: KnowledgeBaseFAQ[] = result.faqs;
        const faqResults: ResultVariableFAQInformation[] = faqs.map((faq) => {
            const text = cleanAnswer(faq.document);
            const markdownText: string = cleanAnswer(addMarkdownHighlights(faq.document, faq.highlights));

            const faqInfo: ResultVariableFAQInformation = {
                question: faq.question,
                text,
                markdownText
            }

            if (faq.uri) {
                faqInfo.source = faq.uri;
            }

            if (faq.handlerId) {
                faqInfo.handlerId = faq.handlerId;
            }

            return faqInfo;
        });

        variables.FAQS = faqResults;
    }

    if (existsAndNotEmpty(result.generated)) {
        // Parse out our generated!
        result.generated.forEach((generated) => {
            if (generated.type === "general-knowledge") {
                if (generated.hasAnswer) {
                    variables.GENERAL_KNOWLEDGE = {
                        text: generated.generated,
                        markdownText: generated.generated
                    }
                } else {
                    variables.GENERATED_NO_ANSWER = {
                        text: generated.generated,
                        markdownText: generated.generated
                    }
                }
            }

            if (generated.type === "retrieval-augmented-generation" && generated.hasAnswer) {
                variables.RAG_RESULT = {
                    text: generated.generated,
                    markdownText: generated.generated,
                    sources: generated.sources
                }
            }

            // New ChatStrategy responses
            if (generated.type === "chat-completion-response") {
                // more common
                variables.CHAT_RESPONSE = {
                    text: generated.generated,
                    markdownText: generated.generated,
                    sources: generated.sources
                }
            }
        });
    }

    if (existsAndNotEmpty(result.suggested)) {
        // Note: We only take the top one
        const suggested = result.suggested[0];
        // Merge intervals to help with the highlighting
        const highlights = mergeIntervals(suggested.highlights);

        if (suggested.topAnswer) {
            // No need to focus the top answer or add highlights since it is a highlight.
            const text = cleanAnswer(suggested.topAnswer);
            const markdownText = cleanAnswer(suggested.topAnswer);
            variables.TOP_ANSWER = {
                text,
                markdownText,
                source: generateTextFragmentURL(suggested.uri, suggested.topAnswer)
            };

        } else if (QNA_BOT_LONGEST_HIGHLIGHT) {
            // We do another try by pulling merging the intervals
            // and we find the longest interval after merging them
            // I don't love this, it doesn't always return good results.
            const longest = longestInterval(highlights);
            if (longest) {
                const topAnswer = suggested.document.substring(longest.beginOffset, longest.endOffset);

                variables.TOP_ANSWER = {
                    text: cleanAnswer(topAnswer),
                    // this one might be different
                    markdownText: cleanAnswer(topAnswer),
                    source: generateTextFragmentURL(suggested.uri, topAnswer)
                };
            }
        }

        // Add suggested with markdown on the displayText with the highlights
        const focused = focusAnswer({ answer: suggested.document, highlights }, config);

        // Add markdown
        const markedDownText = addMarkdownHighlights(focused.answer, focused.highlights);

        variables.SUGGESTED_ANSWER = {
            text: cleanAnswer(focused.answer),
            // This gets tricky, they highlights are no longer correct after adding markdown
            markdownText: cleanAnswer(markedDownText),
            source: generateTextFragmentURL(suggested.uri, focused.answer)
        };
    }

    // And lets see if we have any results.
    if (existsAndNotEmpty(result.documents)) {

        // 1st, dedupe by URL
        const foundUrls: { [url: string]: KnowledgeBaseDocument } = {};
        result.documents.forEach((doc) => {
            if (doc.uri && !foundUrls[doc.uri]) {
                foundUrls[doc.uri] = doc
            }
        });
        const searchResults: ResultVariableListItem[] = [];
        Object.keys(foundUrls).forEach((url: string) => {
            const doc = foundUrls[url];
            // split it up
            const { title, document, uri, highlights } = doc;
            const source = generateTextFragmentURL(uri, document);
            const focused = focusAnswer({ answer: document, highlights }, config);
            const cleaned = cleanAnswer(focused.answer);
            searchResults.push({ title, document: cleaned, source });
        });

        variables.SEARCH_RESULTS = searchResults;
    }

    return variables;
}