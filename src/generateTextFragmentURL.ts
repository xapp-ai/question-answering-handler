/*! Copyright (c) 2021, XAPP AI */

import { URL } from "url";
import { cleanAnswer } from "./cleanAnswer";

/**
 * From the URL and document, a text fragment query is appended.
 * 
 * If there is already an anchor tag, it does not add it.
 * 
 * {@see https://wicg.github.io/scroll-to-text-fragment/}
 * {@see https://github.com/GoogleChromeLabs/link-to-text-fragment}
 * 
 * @param url 
 * @param document 
 */
export function generateTextFragmentURL(url: string, document: string): string {

    if (!url || !document) {
        return url;
    }

    let u: URL;
    try {
        u = new URL(url);
    } catch {
        return url;
    }

    // clean doc first
    let cleaned = cleanAnswer(document).trim();

    // remove leading and trailing ...
    if (cleaned.startsWith("...")) {
        cleaned = cleaned.slice(3, cleaned.length);
    }

    if (cleaned.endsWith("...")) {
        cleaned = cleaned.slice(0, cleaned.length - 3);
    }

    // We need to swap out \n with spaces
    cleaned = cleaned.replace(/[ \n\t]+/g, " ");

    // SPLIT!
    const split = cleaned.split(" ");

    let hash: string;
    // Check the length!
    if (split.length <= 8) {
        hash = encodeURIComponent(cleaned);
    } else {
        // grab
        const textStart = `${split[0]} ${split[1]} ${split[2]} ${split[3]}`;
        const textEnd = `${split[split.length - 4]} ${split[split.length - 3]} ${split[split.length - 2]} ${split[split.length - 1]}`;
        hash = `${encodeURIComponent(textStart)},${encodeURIComponent(textEnd)}`;
    }
    // Note: it doesn't work with a hash
    u.hash = `#:~:text=${hash}`;

    return u.toString();

}