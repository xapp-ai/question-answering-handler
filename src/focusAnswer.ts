/*! Copyright (c) 2021, XAPP AI */
import { existsAndNotEmpty } from "stentor-utils";
import { indexesOf } from "./utils";

export interface FocusConfig {
    /**
     * Sometimes, insight engines provide lead in context from a document to where the answer might be within the text.  This may not be helpful and take up too much room.
     * 
     * If set to true, it will leave 1 line above where the first highlight is found.
     */
    REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS?: boolean;
    /**
     * Removes the trailing lines of a response that do not have highlights.
     */
    REMOVE_TRAILING_LINES_WITHOUT_HIGHLIGHTS?: boolean;
}

export interface Highlight {
    beginOffset: number;
    endOffset: number;
}

export interface FocusableAnswer {
    answer: string;
    highlights: Highlight[];
}

/**
 * Focuses the answer text, removing anything not relevent based on the provided highlights.
 *
 * It will impact the location of the highlights, which is why you should use the new highlights that is passed back.
 *
 * @returns {FocusableAnswer}
 */
export function focusAnswer(focusable: FocusableAnswer, config?: FocusConfig): FocusableAnswer {

    if (!focusable) {
        return focusable;
    }

    if (!existsAndNotEmpty(focusable.highlights)) {
        return focusable;
    }

    if (!config || Object.keys(config).length === 0) {
        return focusable;
    }

    let { answer } = focusable;
    const highlights = [...focusable.highlights];
    let adjustedHighlights: Highlight[] = [...highlights];

    if (config.REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS) {
        // Find the first highlight and figure out how many \n are before it
        if (existsAndNotEmpty(highlights)) {
            // Grab the first
            const firstHighlight = { ...highlights[0] };

            const answerToHighlight = answer.substring(0, firstHighlight.beginOffset);

            // Find all the \n
            const indexes = indexesOf(answerToHighlight, /\n/g);
            if (existsAndNotEmpty(indexes)) {
                // we have instances of \n before the first highlight, get ready to trim
                adjustedHighlights = [];
                // Go back a few and then take a substring, then clean that.
                const cutHere = indexes[indexes.length - 1];
                answer = answer.substring(cutHere, answer.length);
                // Adjust the highlights for where we cut
                highlights.forEach((highlight) => {
                    adjustedHighlights.push({
                        beginOffset: highlight.beginOffset - cutHere,
                        endOffset: highlight.endOffset - cutHere
                    });
                });
            }
        }
    }

    if (config.REMOVE_TRAILING_LINES_WITHOUT_HIGHLIGHTS) {
        // Find the last index
        if (existsAndNotEmpty(adjustedHighlights)) {
            const lastHighlight = { ...adjustedHighlights[highlights.length - 1] };
            // trailing content
            const trailingAnswerFromHighlight = answer.substring(lastHighlight.endOffset);
            const indexes = indexesOf(trailingAnswerFromHighlight, /\n/g);
            const trimHere: number = existsAndNotEmpty(indexes) ? indexes[0] + lastHighlight.endOffset : answer.length;
            answer = answer.substring(0, trimHere);
        }
    }

    return { answer, highlights: adjustedHighlights };
}