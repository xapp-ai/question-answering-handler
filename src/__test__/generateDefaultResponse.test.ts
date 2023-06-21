/*! Copyright (c) 2023, XAPP AI */
import { expect } from "chai";

import { Request, Context, List } from "stentor";
import { SESSION_STORAGE_KNOWLEDGE_BASE_RESULT } from "stentor-constants";
import { ContextBuilder } from "stentor-context";
import { isList } from "stentor-response";
import { generateDefaultResponse } from "../generateDefaultResponse";


// We want to test the following channels:
// - Intelligent Search
// - Chat Widget
// - Google Business Messages
// With the following scenarios:
// - RAG, Top Answer, Top FAQ, Suggested, Results Only
// - Unknown answer

import {
    //   REQUEST_KB_NO_SUGGEST_OR_FAQ_2,
    REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ,
    REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER,
    // KB Results
    // RESULT_WITH_NEWLINES,
    // RESULT_WITH_RAG_RESULT
} from "./assets/payloads";
import { generateResultVariables } from "../generateResultVariables";

describe(`#${generateDefaultResponse.name}()`, () => {

    let request: Request;
    let context: Context;

    describe(`when parameters are passed`, () => {
        it("returns correctly", () => {

            request = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER;

            context = new ContextBuilder()
                .withSessionData({
                    id: "foo",
                    data: {
                        [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult
                    }
                })
                .build();

            const response = generateDefaultResponse(request, context, {});
            expect(response).to.exist;
        });
    });
    describe(`for intelligent search channel`, () => {
        it("returns as expected", () => {
            request = { ...REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER };
            request.channel = "intelligent-search";

            const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult, {});

            context = new ContextBuilder()
                .withSessionData({
                    id: "foo",
                    data: {
                        [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult,
                        ...sessionVariables
                    }
                })
                .build();

            const response = generateDefaultResponse(request, context, {});

            expect(response).to.exist;
            expect(response.displays).to.have.length(1);
            const list = response?.displays[0];
            expect(list).to.exist;
            expect(isList(list)).to.be.true;
            if (isList(list)) {
                expect((list as List).type).to.equal("LIST");
                const items = list.items;
                expect(items).to.have.length(6);
                const item = list.items[0];
                expect(item.title).to.equal("Bonds | Investor.gov");
                expect(item.url).to.include("https://www.investor.gov/introduction");
                expect(item.description).to.include(" To sell an older bond with a lower interest rate")
            }

            expect(typeof response.outputSpeech).to.equal("object");
            expect(response.tag).to.equal("KB_SUGGESTED_ANSWER");

            if (typeof response.outputSpeech === "object") {
                expect(response.outputSpeech.displayText).to.include("Suggested Answer");
            }
        });
        describe("for results only", () => {
            it("returns as expected", () => {

                request = { ...REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ };
                request.channel = "intelligent-search";

                const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult, {});

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult,
                            ...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {
                    search: {
                        numberOfResults: 2
                    }
                });
                expect(response).to.exist;
                expect(response.tag).to.equal("KB_LIST_OF_RESULTS");

                expect(response.outputSpeech).to.deep.equal({ displayText: '', ssml: '', suggestions: [] });

                expect(response.displays).to.have.length(1);
                const list = response?.displays[0];
                expect(list).to.exist;
                expect(isList(list)).to.be.true;
                if (isList(list)) {
                    expect((list as List).type).to.equal("LIST");
                    const items = list.items;
                    expect(items).to.have.length(2);
                    const item = list.items[0];
                    expect(item.title).to.equal("Moving from an Apartment to a House Checklist | Travelers Insurance");
                    expect(item.url).to.include("https://www.travelers.com/resources");
                    expect(item.description).to.include("Tips for Moving With a Pet")
                }
            });
        });
        describe("for no results", () => {
            it("returns as expected", () => {
                request = { ...REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER };
                request.channel = "intelligent-search";

                const sessionVariables = generateResultVariables(request.rawQuery, {}, {});

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: {},
                            ...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {});

                expect(response).to.exist;
                expect(response.displays).to.have.length(0);

                expect(typeof response.outputSpeech).to.equal("object");
                expect(response.tag).to.equal("KB_NO_ANSWER");

                if (typeof response.outputSpeech === "object") {
                    expect(response.outputSpeech.displayText).to.include("No Results");
                }
            });
        });
    });
    describe("for the chat channel", () => {
        it("returns as expected", () => {
            request = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER;

            const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult, {});

            context = new ContextBuilder()
                .withSessionData({
                    id: "foo",
                    data: {
                        [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult,
                        ...sessionVariables
                    }
                })
                .build();

            const response = generateDefaultResponse(request, context, {});

            expect(response).to.exist;
            expect(response.tag).to.equal("KB_SUGGESTED_ANSWER");
            expect(response.displays).to.have.length(0);


            expect(typeof response.outputSpeech).to.equal("object");
            if (typeof response.outputSpeech === "object") {
                expect(response.outputSpeech.displayText).to.include("Any other questions?");
            }

            expect(typeof response.reprompt).to.equal("object");
            if (typeof response.reprompt === "object") {
                expect(response.reprompt.displayText).to.include("Any other questions?");
            }
        });
        describe("with general knowledge answer", () => {
            it("returns as expected", () => {
                request = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER;

                const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult, {});

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult,
                            ...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {});

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_SUGGESTED_ANSWER");
                expect(response.displays).to.have.length(0);


                expect(typeof response.outputSpeech).to.equal("object");
                if (typeof response.outputSpeech === "object") {
                    expect(response.outputSpeech.displayText).to.include("Any other questions?");
                }

                expect(typeof response.reprompt).to.equal("object");
                if (typeof response.reprompt === "object") {
                    expect(response.reprompt.displayText).to.include("Any other questions?");
                }
            });
        });
        describe("with general knowledge no answer", () => {

        });
        describe("for just list of results", () => {
            it("returns as expected", () => {
                request = REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ;

                const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult, {});

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult,
                            ...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {});

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_LIST_OF_RESULTS");
                expect(response.displays).to.have.length(1);

                const list = response?.displays[0];
                expect(list).to.exist;
                expect(isList(list)).to.be.true;
                if (isList(list)) {
                    expect((list as List).type).to.equal("LIST");
                    const items = list.items;
                    expect(items).to.have.length(3);
                    const item = list.items[0];
                    expect(item.title).to.equal("Moving from an Apartment to a House Checklist | Travelers Insurance");
                }

                expect(typeof response.outputSpeech).to.equal("object");
                if (typeof response.outputSpeech === "object") {
                    expect(response.outputSpeech.displayText).to.include("Any other questions?");
                }

                expect(typeof response.reprompt).to.equal("object");
                if (typeof response.reprompt === "object") {
                    expect(response.reprompt.displayText).to.include("Any other questions?");
                }
            });
        });
    });
});