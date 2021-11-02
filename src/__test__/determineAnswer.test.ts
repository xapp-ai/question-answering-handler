/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { determineAnswer } from "../determineAnswer";

describe(`#${determineAnswer.name}()`, () => {
    describe(`for undefined`, () => {
        it(`returns undefined`, () => {
            expect(determineAnswer(undefined, undefined)).to.be.undefined;
        });
    });
    describe(`when faq is better match than suggested`, () => {
        it(`returns the FAQ`, () => {
            const answer = determineAnswer("what is dwelling coverage", {
                suggested: [{
                    title: "Wrong",
                    document: "wrong",
                    topAnswer: "wrong"
                }],
                faqs: [{
                    question: "what is dwelling coverage",
                    document: "expected"
                }]
            });

            expect(answer.document).to.equal("expected");
        });
    });
    describe("when faq is not better than suggested", () => {
        it("returns the suggested", () => {
            const answer = determineAnswer("what is dwelling coverage", {
                suggested: [{
                    title: "Dwelling Coverage",
                    document: "expected",
                    topAnswer: "expected"
                }],
                faqs: [{
                    question: "what is auto coverage",
                    document: "wrong"
                }]
            });

            expect(answer.document).to.equal("expected");
        });
    });
});