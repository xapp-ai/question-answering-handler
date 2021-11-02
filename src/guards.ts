/*! Copyright (c) 2021, XAPP AI */

import { KnowledgeBaseDocument, KnowledgeBaseFAQ, KnowledgeBaseSuggested } from "stentor-models";

export function isSuggested(answer: KnowledgeBaseFAQ | KnowledgeBaseSuggested | KnowledgeBaseDocument): answer is KnowledgeBaseSuggested {
    return !!answer && typeof (answer as KnowledgeBaseSuggested).topAnswer === "string" && (answer as KnowledgeBaseSuggested).topAnswer.length > 0
}

export function isFaq(answer: KnowledgeBaseFAQ | KnowledgeBaseSuggested | KnowledgeBaseDocument): answer is KnowledgeBaseFAQ {
    return !!answer && typeof (answer as KnowledgeBaseFAQ).question === "string" && (answer as KnowledgeBaseFAQ).question.length > 0
}