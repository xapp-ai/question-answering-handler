/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { generateResultVariables } from "../generateResultVariables";
import {
    REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER,
    SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP,
    SUGGESTED_WITH_TOP_ANSWER
} from "./assets/payloads";

describe(`#${generateResultVariables.name}()`, () => {
    describe(`for undefined`, () => {
        it(`returns undefined`, () => {
            expect(generateResultVariables(undefined, undefined, {})).to.deep.equal({});
        });
    });
    describe(`when faq is better fuzzy match than suggested`, () => {
        it(`returns the FAQ`, () => {
            const variables = generateResultVariables("what is dwelling coverage", {
                suggested: [{
                    title: "Dwelling Coverage",
                    document: "Dwelling coverage helps protect the total cost of the home.",
                }],
                faqs: [{
                    question: "what is dwelling coverage",
                    document: "expected"
                }]
            }, { FUZZY_MATCH_FAQS: true });

            expect(variables.TOP_FAQ.text).to.equal("expected");
            expect(variables.TOP_ANSWER).to.be.undefined;
            expect(variables.SUGGESTED_ANSWER.text).to.equal("Dwelling coverage helps protect the total cost of the home.")
        });
    });
    describe("when faq is not better fuzzy than suggested", () => {
        it("returns the suggested", () => {
            const variables = generateResultVariables("what is dwelling coverage", {
                suggested: [{
                    title: "Dwelling Coverage",
                    document: "Dwelling coverage helps protect the total cost of the home.",
                }],
                faqs: [{
                    question: "what is auto coverage",
                    document: "wrong"
                }]
            }, { FUZZY_MATCH_FAQS: true });

            expect(variables.TOP_ANSWER).to.be.undefined;
            expect(variables.SUGGESTED_ANSWER.text).to.equal("Dwelling coverage helps protect the total cost of the home.");
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
            expect(variables.TOP_FAQ).to.be.undefined;
        });
    });
    describe("without a top answer in the suggestions", () => {
        describe("with QNA_BOT_LONGEST_HIGHLIGHT true", () => {
            it("returns the suggested", () => {
                const result0 = SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP.knowledgeBaseResult;
                const variables0 = generateResultVariables("what is a HEL", result0, { QNA_BOT_LONGEST_HIGHLIGHT: true });

                expect(variables0.TOP_ANSWER).to.exist;
                expect(variables0.TOP_ANSWER.text).to.equal("home equity loan");
                expect(variables0.TOP_FAQ).to.be.undefined;

                const result1 = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult;
                const variables1 = generateResultVariables("what is inflation", result1, { QNA_BOT_LONGEST_HIGHLIGHT: true });

                expect(variables1.TOP_ANSWER).to.exist;
                expect(variables1.TOP_ANSWER.text).to.equal("Inflation is a general upward movement in prices");
            });
        });
        describe("with QNA_BOT_LONGEST_HIGHLIGHT false", () => {
            it("returns the suggested", () => {
                const result0 = SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP.knowledgeBaseResult;
                const variables0 = generateResultVariables("what is a HEL", result0, {});
                expect(variables0.TOP_ANSWER).to.be.undefined;
                expect(variables0.TOP_FAQ).to.be.undefined;

                const result1 = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult;
                const variables1 = generateResultVariables("what is inflation", result1, { REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS: true });
                expect(variables1.TOP_ANSWER).to.be.undefined;
                expect(variables1.TOP_FAQ).to.be.undefined;
                expect(variables1.SUGGESTED_ANSWER).to.exist;

                expect(variables1.SEARCH_RESULTS).to.exist;
                expect(variables1.SEARCH_RESULTS).to.have.length(9);
                expect(variables1.SEARCH_RESULTS[0].title).to.equal("Bonds | Investor.gov");
                expect(variables1.SEARCH_RESULTS[0].source).to.equal("https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds")
            });
            describe('with CONFIG', () => {
                it("returns the suggested focused", () => {
                    const result0 = SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP.knowledgeBaseResult;
                    const variables0 = generateResultVariables("what is a HEL", result0, { REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS: true });
                    expect(variables0.TOP_ANSWER).to.be.undefined;
                    expect(variables0.TOP_FAQ).to.be.undefined;

                    expect(variables0.SUGGESTED_ANSWER).to.exist;
                    expect(variables0.SUGGESTED_ANSWER.markdownText).to.contain("What is a **home equity loan**?");
                    expect(variables0.SUGGESTED_ANSWER.markdownText).to.contain("(sometimes called a **HEL**)");

                    const result1 = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult;

                    const variables1 = generateResultVariables("what is inflation", result1, { REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS: true, QNA_BOT_LONGEST_HIGHLIGHT: true });

                    expect(variables1.TOP_ANSWER).to.exist;
                    expect(variables1.TOP_ANSWER.text).to.equal("Inflation is a general upward movement in prices");

                    expect(variables1.TOP_FAQ).to.be.undefined;
                });
            });
        });
    });
});