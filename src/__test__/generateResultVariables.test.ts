/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { KnowledgeBaseResult } from "stentor";

import { generateResultVariables } from "../generateResultVariables";
import {
    REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER,
    SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP,
    SUGGESTED_WITH_TOP_ANSWER
} from "./assets/payloads";

import * as intent0 from "./assets/intent-kb-results-0.json";
import * as intent1 from "./assets/intent-kb-results-1.json";
import * as intent3 from "./assets/intent-kb-results-3.json";


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
                    document: "FAQ: Dwelling coverage helps protect the total cost of the home.",
                    highlights: [{
                        beginOffset: 5,
                        endOffset: 64
                    }]
                }]
            }, { FUZZY_MATCH_FAQS: true });

            expect(variables.TOP_FAQ.text).to.equal("FAQ: Dwelling coverage helps protect the total cost of the home.");
            expect(variables.TOP_FAQ.markdownText).to.equal("FAQ: Dwelling coverage helps protect the total cost of the home.");
            expect(variables.TOP_ANSWER).to.be.undefined;
            expect(variables.SUGGESTED_ANSWER.text).to.equal("Dwelling coverage helps protect the total cost of the home.");
        });
        describe("with HIGHLIGHT_TOP_FAQ set to true", () => {
            it(`returns the FAQ`, () => {
                const variables = generateResultVariables("what is dwelling coverage", {
                    suggested: [{
                        title: "Dwelling Coverage",
                        document: "Dwelling coverage helps protect the total cost of the home.",
                    }],
                    faqs: [{
                        question: "what is dwelling coverage",
                        document: "FAQ: Dwelling coverage helps protect the total cost of the home.",
                        highlights: [{
                            beginOffset: 5,
                            endOffset: 64
                        }],
                        handlerId: "Foo"
                    }]
                }, { FUZZY_MATCH_FAQS: true, HIGHLIGHT_TOP_FAQ: true });

                expect(variables.TOP_FAQ.text).to.equal("FAQ: Dwelling coverage helps protect the total cost of the home.");
                expect(variables.TOP_FAQ.markdownText).to.equal("FAQ: **Dwelling coverage helps protect the total cost of the home.**");
                expect(variables.TOP_FAQ.handlerId).to.equal("Foo");
                expect(variables.TOP_ANSWER).to.be.undefined;
                expect(variables.SUGGESTED_ANSWER.text).to.equal("Dwelling coverage helps protect the total cost of the home.");
            });
        });
        it("returns the correct URL", () => {
            const variables = generateResultVariables(intent1.rawQuery, intent1.knowledgeBaseResult, { FUZZY_MATCH_FAQS: true });
            expect(variables.TOP_FAQ.text).to.equal("There are people who understand how to save and those who don't. If you don't understand how to save, it is better to pay off your home mortgage.");
            expect(variables.TOP_FAQ.source).to.equal("https://www.forbes.com/sites/davidmarotta/2021/04/28/should-i-pay-off-my-mortgage/?sh=1c6aa4b74532#:~:text=There%20are%20people%20who,off%20your%20home%20mortgage.");
            expect(variables.TOP_ANSWER).to.be.undefined;
            expect(variables.SUGGESTED_ANSWER.source).to.equal("https://www.consumerfinance.gov/consumer-tools/mortgages/key-terms#:~:text=A%20demand%20feature%20permits,for%20a%20home%20purchase.");
        });
    });
    describe("when faq is not better fuzzy than suggested", () => {
        it("returns the suggested", () => {
            const variables = generateResultVariables("what is dwelling coverage", {
                suggested: [{
                    title: "Dwelling Coverage",
                    document: "Dwelling coverage helps protect the total cost of the home.",
                    uri: "https://right.com"
                }],
                faqs: [{
                    question: "what is auto coverage",
                    document: "wrong",
                    uri: "https://wrong.com",
                    highlights: []
                }]
            }, { FUZZY_MATCH_FAQS: true });

            expect(variables.TOP_ANSWER).to.be.undefined;
            expect(variables.SUGGESTED_ANSWER.text).to.equal("Dwelling coverage helps protect the total cost of the home.");
            expect(variables.SUGGESTED_ANSWER.source).to.equal("https://right.com/#:~:text=Dwelling%20coverage%20helps%20protect,cost%20of%20the%20home.");
            expect(variables.TOP_FAQ).to.be.undefined;
        });
        describe("with highlights on the suggested", () => {
            it("returns the proper highlights", () => {
                const variables = generateResultVariables(intent0.rawQuery, intent0.knowledgeBaseResult, { FUZZY_MATCH_FAQS: true, });
                expect(variables.TOP_FAQ).to.undefined;
                expect(variables.TOP_ANSWER).to.be.undefined;
                expect(variables.SUGGESTED_ANSWER.text).to.include("customers and operations of banks, savings associations and credit unions (collectively, “financial institutions”).");
                expect(variables.SUGGESTED_ANSWER.markdownText).to.include("customers and operations of banks, savings associations and credit unions (collectively, “**financial** **institutions**”).");
            });
            describe("with REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS config", () => {
                it("returns the proper highlights", () => {
                    const variables = generateResultVariables(intent0.rawQuery, intent0.knowledgeBaseResult, { FUZZY_MATCH_FAQS: true, REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS: true });
                    expect(variables.TOP_FAQ).to.undefined;
                    expect(variables.TOP_ANSWER).to.be.undefined;
                    expect(variables.SUGGESTED_ANSWER.text).to.include("customers and operations of banks, savings associations and credit unions (collectively, “financial institutions”).");
                    expect(variables.SUGGESTED_ANSWER.markdownText).to.include("customers and operations of banks, savings associations and credit unions (collectively, “**financial** **institutions**”).");
                });
            });
        });
    });
    describe("with a top answer in the suggestion", () => {
        it("returns the suggested", () => {
            const result = SUGGESTED_WITH_TOP_ANSWER.knowledgeBaseResult;
            const variables = generateResultVariables("what is dwelling coverage", result, {});

            expect(variables.TOP_ANSWER).to.exist;
            expect(variables.TOP_ANSWER.text).to.equal("This coverage can help pay to repair or rebuild the physical structure of your home in the event of a fire or other covered cause of loss");

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
                expect(variables1.SEARCH_RESULTS[0].source).to.equal("https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds#:~:text=rate%20of%20interest%20than,fixed%20rate%20of%20interest")
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
    describe("when a document doesn't have a URL", () => {
        it("generates the correct variables", () => {
            const result0 = intent3.knowledgeBaseResult;
            const query0 = intent3.rawQuery;
            const variables0 = generateResultVariables(query0, result0, {});
            // 4
            expect(variables0).to.exist;
            const docs0 = variables0.SEARCH_RESULTS;
            expect(docs0).to.have.length(3);

            const first = docs0[0];
            expect(first.title).to.equal("Wind Damage - Barringer Brothers Roofing");
            const second = docs0[1];
            expect(second.document).to.include("...Business Bureau.");
        });
    });
    describe("when generated answers exist", () => {
        it("generates the correct variables", () => {

            const result0: KnowledgeBaseResult = {
                generated: [
                    {
                        hasAnswer: true,
                        type: "retrieval-augmented-generation",
                        generated: "This is generated with the answer",
                        document: "This is generated with the answer"
                    }
                ],
                documents: []
            };

            const variables0 = generateResultVariables("give me an answer", result0, {});
            expect(variables0).to.exist;
            expect(variables0.RAG_RESULT).to.exist;
            expect(variables0.RAG_RESULT?.text).to.equal("This is generated with the answer");

            const result1: KnowledgeBaseResult = {
                generated: [
                    {
                        hasAnswer: false,
                        type: "retrieval-augmented-generation",
                        generated: "This is generated with the answer",
                        document: "This is generated with the answer"
                    },
                    {
                        hasAnswer: false,
                        type: "general-knowledge",
                        generated: "This is generated without an answer",
                        document: "This is generated without an answer"
                    },
                ],
                documents: []
            };

            const variables1 = generateResultVariables("give me an answer", result1, {});
            expect(variables1).to.exist;
            expect(variables1.RAG_RESULT).to.not.exist;
            expect(variables1.GENERATED_NO_ANSWER).to.exist;
            expect(variables1.GENERATED_NO_ANSWER?.text).to.equal("This is generated without an answer");

            const result2: KnowledgeBaseResult = {
                generated: [
                    {
                        hasAnswer: false,
                        type: "retrieval-augmented-generation",
                        generated: "This is generated without an answer",
                        document: "This is generated without an answer"
                    },
                    {
                        hasAnswer: true,
                        type: "general-knowledge",
                        generated: "This is generated with an answer",
                        document: "This is generated with an answer"
                    },
                ],
                documents: []
            };

            const variables2 = generateResultVariables("give me an answer", result2, {});
            expect(variables2).to.exist;
            expect(variables2.RAG_RESULT).to.not.exist;
            expect(variables2.GENERATED_NO_ANSWER).to.not.exist;

            expect(variables2.GENERAL_KNOWLEDGE).to.exist;
            expect(variables2.GENERAL_KNOWLEDGE?.text).to.equal("This is generated with an answer");
        });
    });
});