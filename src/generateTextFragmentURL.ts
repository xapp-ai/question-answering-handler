/*! Copyright (c) 2021, XAPP AI */

import { URL } from "url";
import { cleanAnswer } from "./cleanAnswer";

/**
 * From the URL and document, a text fragment query is appended.
 * 
 * If there is already an anchor tag, it does not add it.
 * 
 * @param url 
 * @param document 
 */
export function generateTextFragmentURL(url: string, document: string): string {

    if (!url || !document) {
        return url;
    }

    const u = new URL(url);

    // clean doc first
    let cleaned = cleanAnswer(document).trim();

    // remove leading and trailing ...
    if (cleaned.startsWith("...")) {
        cleaned = cleaned.slice(3, cleaned.length);
    }

    if (cleaned.endsWith("...")) {
        cleaned = cleaned.slice(0, cleaned.length - 3);
    }

    // SPLIT!
    const split = cleaned.split(" ");

    let hash: string;
    // Check the length!
    if (split.length <= 5) {
        hash = encodeURI(cleaned);
    } else {
        // grab
        hash = `${split[0]} ${split[1]} ${split[2]},${split[split.length - 2]} ${split[split.length - 1]}`
    }

    if (u.hash) {
        u.hash = `${u.hash}:~:text=${hash}`;
    } else {
        u.hash = `#:~:text=${hash}`;
    }

    return u.toString();

}