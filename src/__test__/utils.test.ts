/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { longestInterval } from "../utils";

describe(`#${longestInterval.name}()`, () => {
    it("returns the correct value", () => {
        expect(longestInterval(undefined)).to.be.undefined;
        expect(longestInterval([
            { beginOffset: 0, endOffset: 48, topAnswer: false },
            { beginOffset: 50, endOffset: 59, topAnswer: false }
        ])).to.deep.equal({ beginOffset: 0, endOffset: 48, topAnswer: false });
    });
});