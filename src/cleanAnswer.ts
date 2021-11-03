/*! Copyright (c) 2021, XAPP AI */
import { cleanTags } from "stentor-utils";

/**
 * Cleans an answer for display
 * 
 * * Removes additional new lines
 * * Removes HTML/XML
 * 
 * It returns undefined if passed in undefined.
 * 
 * @param answer 
 */
export function cleanAnswer(answer: string): string {

    if (!answer) {
        return answer;
    }

    answer = cleanTags(answer);
    // Remove spaces when more then 2
    answer = answer.replace(/( ){3,}/g, '');
    // Remove tabs when more than one
    answer = answer.replace(/\t{2,}/g, '');
    // Remove the random \t\n
    answer = answer.replace(/\t\n/g, '\n');
    // Remove starting newlines
    answer = answer.replace(/^(\r\n|\r|\n){2,}/g, '');
    // Remove the multiple newlines when more than 1
    answer = answer.replace(/(\r\n|\r|\n){2,}/g, '\n\n');
    // This is one more check where the above step could have helped clean up but we end up with a combination of \n & spaces.
    answer = answer.replace(/(\n| ){3,}/g, '\n\n');

    return answer;
}
