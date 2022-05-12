/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { addMarkdownHighlight, addMarkdownHighlights, longestInterval } from "../utils";

describe(`#${longestInterval.name}()`, () => {
    it("returns the correct value", () => {
        expect(longestInterval(undefined)).to.be.undefined;
        expect(longestInterval([
            { beginOffset: 0, endOffset: 48, topAnswer: false },
            { beginOffset: 50, endOffset: 59, topAnswer: false }
        ])).to.deep.equal({ beginOffset: 0, endOffset: 48, topAnswer: false });
    });
});

describe(`#${addMarkdownHighlight.name}()`, () => {
    it("returns the correct value", () => {
        expect(addMarkdownHighlight("a b c d e", 2, 3)).to.equal("a **b** c d e")
    });
});

describe(`#${addMarkdownHighlights.name}()`, () => {
    it("returns the correct value", () => {
        const highlights = [{ beginOffset: 2, endOffset: 3 }, { beginOffset: 6, endOffset: 7 }]
        expect(addMarkdownHighlights("a b c d e", highlights)).to.equal("a **b** c **d** e");
    });
});