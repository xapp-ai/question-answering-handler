/*! Copyright (c) 2021, XAPP AI */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Fuse = require('fuse.js');

import type { KnowledgeBaseFAQ, KnowledgeBaseResult, KnowledgeBaseSuggested, KnowledgeBaseDocument } from "stentor-models";

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