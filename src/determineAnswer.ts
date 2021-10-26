/*! Copyright (c) 2021, XAPP AI */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Fuse = require('fuse.js');

import { KnowledgeBaseFAQ, KnowledgeBaseResult, KnowledgeBaseSuggested, KnowledgeBaseDocument } from "stentor-models";
import { existsAndNotEmpty } from "stentor-utils";
import { cleanAnswer } from "./cleanAnswer";
import { mergeIntervals, longestInterval, addMarkdownHighlights } from "./utils";

export interface ResultVariablesConfig {
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
     * Maximum number of items to include in the list
     */
    ["MAX_LIST_ITEMS"]?: number;
}


export interface ResultVariableInformation {
    text?: string;
    markdownText?: string;
    source?: string;
}

export interface ResultVariables {
    TOP_ANSWER?: ResultVariableInformation;
    SUGGESTED_ANSWER?: ResultVariableInformation;
    TOP_FAQ?: ResultVariableInformation;
}

export function generateResultVariables(query: string, result: KnowledgeBaseResult, config: ResultVariablesConfig): ResultVariables {

    if (!query || !result) {
        return {}
    }

    const { FUZZY_MATCH_FAQS, QNA_BOT_LONGEST_HIGHLIGHT } = config || {};

    // Get possible FAQ matches
    let topFAQ: KnowledgeBaseFAQ = existsAndNotEmpty(result.faqs) ? result.faqs[0] : undefined;

    if (typeof FUZZY_MATCH_FAQS === "number" || FUZZY_MATCH_FAQS === true) {
        const faqs: KnowledgeBaseFAQ[] = result.faqs;
        const threshold: number = typeof FUZZY_MATCH_FAQS === "number" ? FUZZY_MATCH_FAQS : 0.2;
        // fuzzy string matching on the question, comparing to the query
        const fuse = new Fuse(faqs, { threshold, includeScore: true, keys: ["question"] });
        const results: { item: KnowledgeBaseFAQ }[] = fuse.search(query);
        const possibleFaqs: KnowledgeBaseFAQ[] = results.map((result => result.item));

        if (possibleFaqs.length > 0) {
            topFAQ = possibleFaqs[0];
        }
    }

    const variables: ResultVariables = {};

    if (topFAQ) {
        variables.TOP_FAQ = {
            text: cleanAnswer(topFAQ.document),
            markdownText: cleanAnswer(addMarkdownHighlights(topFAQ.document, topFAQ.highlights)),
            source: topFAQ.uri
        }
    }

    if (existsAndNotEmpty(result.suggested)) {
        // Note: We only take the top one
        const suggested = result.suggested[0];
        // Merge intervals to help with the highlighting
        const highlights = mergeIntervals(suggested.highlights);

        if (suggested.topAnswer) {

            variables.TOP_ANSWER = {
                text: cleanAnswer(suggested.topAnswer),
                markdownText: cleanAnswer(suggested.topAnswer),
                source: suggested.uri
            }

        } else if (QNA_BOT_LONGEST_HIGHLIGHT) {
            // We do another try by pulling merging the intervals
            // and we find the longest interval after merging them
            // I don't love this, it doesn't always return good results.
            const longest = longestInterval(highlights);

            const topAnswer = suggested.document.substring(longest.beginOffset, longest.endOffset);

            variables.TOP_ANSWER = {
                text: cleanAnswer(topAnswer),
                // this one might be different
                markdownText: cleanAnswer(topAnswer),
                source: suggested.uri
            }
        }

        // Add suggested with markdown on the displayText with the highlights

        variables.SUGGESTED_ANSWER = {
            text: cleanAnswer(suggested.document),
            markdownText: cleanAnswer(addMarkdownHighlights(suggested.document, suggested.highlights)),
            source: suggested.uri
        };
    }

    return variables;
}

/**
 * Determines the best answer for the query.
 * 
 * @param query 
 * @param result 
 * @param threshold 
 * @deprecated
 */
export function determineAnswer(query: string, result: KnowledgeBaseResult, threshold = 0.2): KnowledgeBaseFAQ | KnowledgeBaseSuggested | KnowledgeBaseDocument {

    if (!query || !result) {
        return undefined
    }

    const faqs: KnowledgeBaseFAQ[] = result.faqs;
    // fuzzy string matching on the question, comparing to the query
    const fuse = new Fuse(faqs, { threshold, includeScore: true, keys: ["question"] });
    const results: { item: KnowledgeBaseFAQ }[] = fuse.search(query);
    const possibleFaqs: KnowledgeBaseFAQ[] = results.map((result => result.item));


    if (possibleFaqs.length > 0) {
        return possibleFaqs[0];
    }

    const possibleSuggested: KnowledgeBaseSuggested[] = result.suggested;

    if (possibleSuggested.length > 0) {
        return possibleSuggested[0];
    }
    // Don't know
    return undefined;

}