/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { MOSTLY_CLEAN_SUGGESTED } from "./assets/payloads";
import { generateTextFragmentURL } from "../generateTextFragmentURL";


const STARTS_WITH_ELLIPSES = MOSTLY_CLEAN_SUGGESTED.documents[0];

describe(`#${generateTextFragmentURL.name}()`, () => {
    describe(`for undefined`, () => {
        it(`returns undefined`, () => {
            expect(generateTextFragmentURL(undefined, "foo bar")).to.equal(undefined);
            expect(generateTextFragmentURL("https://xapp.ai", undefined)).to.equal("https://xapp.ai");
        });
    });
    describe('with url and document', () => {
        it("returns the correct result", () => {
            expect(generateTextFragmentURL(STARTS_WITH_ELLIPSES.uri, STARTS_WITH_ELLIPSES.document)).to.equal("https://www.consumerfinance.gov/ask-cfpb/what-exactly-happens-when-a-mortgage-lender-checks-my-credit-en-2005#:~:text=to%20be%20smart,or%20during");
            expect(generateTextFragmentURL(STARTS_WITH_ELLIPSES.uri, "about them. As a general")).to.equal("https://www.consumerfinance.gov/ask-cfpb/what-exactly-happens-when-a-mortgage-lender-checks-my-credit-en-2005#:~:text=about%20them.%20As%20a%20general");
            expect(generateTextFragmentURL("https://en.wikipedia.org/wiki/History_of_computing#Early_computation", "These kinds of statements have existed for thousands of years, and across multiple civilizations, as shown")).to.equal("https://en.wikipedia.org/wiki/History_of_computing#Early_computation:~:text=These%20kinds%20of,as%20shown")
        });
    });
});