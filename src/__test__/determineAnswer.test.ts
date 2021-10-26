/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { determineAnswer, generateResultVariables } from "../determineAnswer";
import {
    REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER,
    SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP,
    SUGGESTED_WITH_TOP_ANSWER
} from "./assets/payloads";

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

describe(`#${generateResultVariables.name}()`, () => {
    describe(`for undefined`, () => {
        it(`returns undefined`, () => {
            expect(generateResultVariables(undefined, undefined, {})).to.deep.equal({});
        });
    });
    describe(`when faq is better match than suggested`, () => {
        it(`returns the FAQ`, () => {
            const variables = generateResultVariables("what is dwelling coverage", {
                suggested: [{
                    title: "Wrong",
                    document: "wrong",
                    topAnswer: "wrong"
                }],
                faqs: [{
                    question: "what is dwelling coverage",
                    document: "expected"
                }]
            }, {});

            expect(variables.TOP_FAQ.text).to.equal("expected");
            expect(variables.SUGGESTED_ANSWER).to.be.undefined;
        });
    });
    describe("when faq is not better than suggested", () => {
        it("returns the suggested", () => {
            const variables = generateResultVariables("what is dwelling coverage", {
                suggested: [{
                    title: "Dwelling Coverage",
                    document: "expected",
                    topAnswer: "expected"
                }],
                faqs: [{
                    question: "what is auto coverage",
                    document: "wrong"
                }]
            }, {});

            expect(variables.SUGGESTED_ANSWER.text).to.equal("expected");
            expect(variables.TOP_FAQ).to.be.undefined;
        });
    });
    describe("with a top answer in the suggestion", () => {
        it("returns the suggested", () => {
            const result = SUGGESTED_WITH_TOP_ANSWER.knowledgeBaseResult;
            const variables = generateResultVariables("what is dwelling coverage", result, {});

            expect(variables.TOP_ANSWER).to.exist;
            expect(variables.TOP_ANSWER.text).to.equal("This coverage can help pay to repair or rebuild the physical structure of your home in the event of a fire or other covered cause of loss");
            // expect(variables.SUGGESTED_ANSWER).to.equal("expected");
            // expect(variables.TOP_FAQ).to.be.undefined;
        });
    });
    describe("without a top answer in the suggestions", () => {
        describe("with QNA_BOT_LONGEST_HIGHLIGHT true", () => {
            it("returns the suggested", () => {
                const result0 = SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP.knowledgeBaseResult;
                const variables0 = generateResultVariables("what is a HEL", result0, { QNA_BOT_LONGEST_HIGHLIGHT: true });
                console.log(variables0);
                expect(variables0.TOP_ANSWER).to.exist;
                expect(variables0.TOP_ANSWER).to.equal("home equity loan");
                // expect(variables.TOP_FAQ).to.be.undefined;

                const result1 = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult;
                const variables1 = generateResultVariables("what is inflation", result1, { QNA_BOT_LONGEST_HIGHLIGHT: true });
                console.log(variables1);
                expect(variables1.TOP_ANSWER).to.exist;
                expect(variables1.TOP_ANSWER).to.equal("Inflation is a general upward movement in prices");
            });
        });
        describe("with QNA_BOT_LONGEST_HIGHLIGHT false", () => {
            it("returns the suggested", () => {
                const result0 = SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP.knowledgeBaseResult;
                const variables0 = generateResultVariables("what is a HEL", result0, {});
                expect(variables0.TOP_ANSWER).to.be.undefined;

                const result1 = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult;
                const variables1 = generateResultVariables("what is inflation", result1, {});
                expect(variables1.TOP_ANSWER).to.be.undefined;
            });
        });
    });
});