/*! Copyright (c) 2023, XAPP AI */
import nlp from "compromise";

/**
 * Detects if the provided string is a question
 * 
 * @param str 
 * @returns 
 */
export function isQuestion(str: string): boolean {
    const doc = nlp(str);
    const questions = doc.questions();
    // Check if the sentence is a question
    return questions.length > 0;
}

/**
 * Determines if the last sentence is a question.
 * 
 * @param text 
 * @returns 
 */
export function lastSentenceIsQuestion(text: string): boolean {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');

    const lastSentence = sentences[sentences.length - 1];
    return nlp(lastSentence).questions().out('array').length > 0;
}

/**
 * Pops the last question from a group of sentences.  It returns an array of strings, the first element is the text without the last question, the second element is the last question.
 */
export function popLastQuestion(text: string): string[] {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');

    const lastSentence = sentences[sentences.length - 1];
    if (nlp(lastSentence).questions().out('array').length > 0) {
        return [text.substring(0, text.lastIndexOf(lastSentence)).trim(), lastSentence];
    }

    return [text, ""];
}