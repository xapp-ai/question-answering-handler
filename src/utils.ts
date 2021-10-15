/*! Copyright (c) 2021, XAPP AI */
import * as linkify from "linkifyjs";
import { KnowledgeBaseHighlight } from "stentor-models";


/**
 * Function to sort and merge overlapping intervals
 * @param intervals
 * @returns [*]
 * Source: https://gist.github.com/vrachieru/5649bce26004d8a4682b
 */
export function mergeIntervals(intervals: KnowledgeBaseHighlight[]): KnowledgeBaseHighlight[] {
    // test if there are at least 2 intervals
    if (intervals.length <= 1) {
        return intervals;
    }

    const stack: KnowledgeBaseHighlight[] = [];
    let top = null;

    // sort the intervals based on their start values
    intervals.sort(function (a, b) { return a.beginOffset - b.beginOffset });

    // push the 1st interval into the stack
    stack.push(intervals[0]);

    // start from the next interval and merge if needed
    for (let i = 1; i < intervals.length; i++) {
        // get the top element
        top = stack[stack.length - 1];

        // if the current interval doesn't overlap with the 
        // stack top element, push it to the stack
        if (top.endOffset < intervals[i].beginOffset) {
            stack.push(intervals[i]);
        }
        // otherwise update the end value of the top element
        // if end of current interval is higher
        else if (top.endOffset < intervals[i].endOffset) {
            top.endOffset = intervals[i].endOffset;
            stack.pop();
            stack.push(top);
        }
    }

    return stack;
}

/**
 * Function to return the longest interval from a list of sorted intervals
 * @param intervals
 * @returns {*}
 */
export function longestInterval(intervals: KnowledgeBaseHighlight[]): KnowledgeBaseHighlight {
    // test if there are at least 2 intervals
    if (!intervals || intervals.length == 0) {
        return undefined;
    } else if (intervals.length == 1) {
        return intervals[0];
    }

    // sort the intervals based on their length
    intervals.sort((b, a) => { return (a.endOffset - a.beginOffset) - (b.endOffset - b.beginOffset) });
    return intervals[0];
}

/**
 *
 * From https://github.com/aws-solutions/aws-qnabot/blob/aaef24ac610bb5f0324326c92914bda21bccef57/lambda/es-proxy-layer/lib/kendra.js#L83 
 * @param {*} textIn
 * @param {*} hlBeginOffset
 * @returns
 */
export function isHighlightInLink(textIn: string, hlBeginOffset: number): boolean {
    const links = linkify.find(textIn);
    for (let l = 0; l < links.length; l++) {
        const linkText = links[l].value;
        const linkBeginOffset = textIn.indexOf(linkText);
        const linkEndOffset = linkBeginOffset + linkText.length;
        if (hlBeginOffset >= linkBeginOffset && hlBeginOffset <= linkEndOffset) {
            return true;
        }
    }
    return false;
}

/**
 * Function to bold highlights in Kendra answer by adding markdown
 * 
 * From https://github.com/aws-solutions/aws-qnabot/blob/aaef24ac610bb5f0324326c92914bda21bccef57/lambda/es-proxy-layer/lib/kendra.js#L67 
 * 
 * @param {string} textIn
 * @param {number} hlBeginOffset
 * @param {number} hlEndOffset
 * @param {boolean} highlightOnly
 * @returns {string}
 */
export function addMarkdownHighlights(textIn: string, hlBeginOffset: number, hlEndOffset: number, highlightOnly = false): string {
    const beginning = textIn.substring(0, hlBeginOffset);
    const highlight = textIn.substring(hlBeginOffset, hlEndOffset);
    const rest = textIn.substr(hlEndOffset);
    let textOut = textIn; //default
    // add markdown only if highlight is not in the middle of a url/link.. 
    if (!isHighlightInLink(textIn, hlBeginOffset)) {
        if (highlightOnly) {
            textOut = '**' + highlight + '**';
        } else {
            textOut = beginning + '**' + highlight + '**' + rest;
        }
    }
    return textOut;
}

