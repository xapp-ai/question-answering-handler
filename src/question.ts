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