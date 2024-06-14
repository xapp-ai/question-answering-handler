/*! Copyright (c) 2023, XAPP AI */
import { expect } from "chai";

import {
    Context,
    IntentRequestBuilder,
    KnowledgeBaseFAQ,
    KnowledgeBaseResult,
    List,
    Request,
} from "stentor";
import { SESSION_STORAGE_KNOWLEDGE_BASE_RESULT } from "stentor-constants";
import { ContextBuilder } from "stentor-context";
import { isList } from "stentor-response";
import { generateDefaultResponse } from "../generateDefaultResponse";

import {
    REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ,
    REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER,
    VARIABLES_WITH_CHAT,
    VARIABLES_WITH_CHAT_AND_FOLLOW_UP,
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

            const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult, {});

            request = { ...REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER };
            request.channel = "intelligent-search";
            request.attributes = { ...sessionVariables };

            context = new ContextBuilder()
                .withSessionData({
                    id: "foo",
                    data: {
                        [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult,
                        // ...sessionVariables
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

                const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult, {});

                request = { ...REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ };
                request.channel = "intelligent-search";
                request.attributes = { ...sessionVariables };

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult,
                            //...sessionVariables
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
        describe("with RAG response", () => {
            it("returns as expected", () => {

                const kb: KnowledgeBaseResult = {
                    generated: [
                        {
                            hasAnswer: true,
                            generated: "This is the answer",
                            document: "This is the answer",
                            sources: [
                                {
                                    title: "First Source",
                                    url: "https://source.one"
                                },
                                {
                                    title: "Second Source",
                                    url: "https://source.two"
                                },
                                {
                                    title: "Ignore, no URL"
                                },
                                {
                                    title: "Third Source",
                                    url: "https://source.third"
                                }
                            ],
                            type: "retrieval-augmented-generation"
                        }
                    ]
                }

                request = new IntentRequestBuilder().withRawQuery("what is the answer").withIntentId("OCSearch").withKnowledgeBaseResult(kb).build();

                const sessionVariables = generateResultVariables(request.rawQuery, kb, {});

                request.attributes = { ...sessionVariables };

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: kb,
                            // ...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {
                    chat: {
                        followUp: "",
                        suggestionChips: [{
                            title: "Suggestion One"
                        }]
                    }
                });

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_RAG");
                expect(response.displays).to.have.length(0);

                expect(typeof response.outputSpeech).to.equal("object");
                if (typeof response.outputSpeech === "object") {
                    expect(response.outputSpeech.displayText).to.equal("This is the answer");

                    expect(response.outputSpeech.suggestions).to.have.length(4);
                    expect(response.outputSpeech.suggestions[0]).to.deep.equal({ title: "First Source", url: "https://source.one" });
                }

                expect(typeof response.reprompt).to.equal("object");
                if (typeof response.reprompt === "object") {
                    expect(response.reprompt.displayText).to.equal("");
                }
            });
        });
        describe("for a top FAQ", () => {
            it("returns as expected", () => {
                const topFAQ: KnowledgeBaseFAQ = {
                    question: "What is the answer?",
                    questions: ["What is the answer?", "Do you have the answer?"],
                    document: "This is the FAQ answer",
                    uri: "https://xapp.ai"
                }

                const kb: KnowledgeBaseResult = {
                    faqs: [topFAQ],
                    generated: [
                        {
                            hasAnswer: true,
                            generated: "This is the answer",
                            document: "This is the answer",
                            sources: [
                                {
                                    title: "First Source",
                                    url: "https://source.one"
                                },
                                {
                                    title: "Second Source",
                                    url: "https://source.two"
                                },
                                {
                                    title: "Ignore, no URL"
                                },
                                {
                                    title: "Third Source",
                                    url: "https://source.third"
                                }
                            ],
                            type: "retrieval-augmented-generation"
                        }
                    ],
                    documents: [

                    ]
                }

                request = new IntentRequestBuilder().withRawQuery("what is the answer").withIntentId("OCSearch").withKnowledgeBaseResult(kb).build();

                const sessionVariables = generateResultVariables(request.rawQuery, kb, {});

                request.attributes = { ...sessionVariables };

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: kb,
                            //...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {
                    chat: {
                        followUp: "",
                        suggestionChips: [{
                            title: "Suggestion One"
                        }]
                    }
                });

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_TOP_FAQ");
                expect(response.displays).to.have.length(0);

                expect(typeof response.outputSpeech).to.equal("object");
                if (typeof response.outputSpeech === "object") {
                    expect(response.outputSpeech.displayText).to.equal("This is the FAQ answer");
                    expect(response.outputSpeech.suggestions).to.have.length(2);
                    expect(response.outputSpeech.suggestions[0]).to.deep.equal({ title: "Read More", url: "https://xapp.ai/#:~:text=This%20is%20the%20FAQ%20answer" });
                }

                expect(typeof response.reprompt).to.equal("object");
                if (typeof response.reprompt === "object") {
                    expect(response.reprompt.displayText).to.equal("");
                }

            });
        })
    });
    describe("for the chat channel", () => {
        it("returns as expected", () => {
            request = REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER;

            const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult, {});

            request.attributes = { ...sessionVariables };

            context = new ContextBuilder()
                .withSessionData({
                    id: "foo",
                    data: {
                        [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult,
                        // ...sessionVariables
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

                const kb: KnowledgeBaseResult = {
                    generated: [
                        {
                            hasAnswer: true,
                            generated: "This is the answer",
                            document: "This is the answer",
                            uri: "https://xapp.ai",
                            type: "general-knowledge"
                        }
                    ]
                }

                request = new IntentRequestBuilder().withRawQuery("what is the answer").withIntentId("OCSearch").withKnowledgeBaseResult(kb).build();

                const sessionVariables = generateResultVariables(request.rawQuery, kb, {});

                request.attributes = { ...sessionVariables };

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: kb,
                            // ...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {
                    chat: {
                        followUp: "",
                        suggestionChips: [{
                            title: "Suggestion One"
                        }]
                    }
                });

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_GENERAL_KNOWLEDGE");
                expect(response.displays).to.have.length(0);

                expect(typeof response.outputSpeech).to.equal("object");
                if (typeof response.outputSpeech === "object") {
                    expect(response.outputSpeech.displayText).to.equal("This is the answer");

                    expect(response.outputSpeech.suggestions).to.have.length(1);
                    expect(response.outputSpeech.suggestions[0]).to.deep.equal({ title: "Suggestion One" });
                }

                expect(typeof response.reprompt).to.equal("object");
                if (typeof response.reprompt === "object") {
                    expect(response.reprompt.displayText).to.equal("");
                }
            });
        });
        describe("with general knowledge no answer", () => {
            it("returns as expected", () => {

                const kb: KnowledgeBaseResult = {
                    generated: [
                        {
                            hasAnswer: false,
                            generated: "This is not the answer",
                            document: "This is not the answer",
                            uri: "https://xapp.ai",
                            type: "general-knowledge"
                        }
                    ]
                }

                request = new IntentRequestBuilder().withRawQuery("what is the answer").withIntentId("OCSearch").withKnowledgeBaseResult(kb).build();

                const sessionVariables = generateResultVariables(request.rawQuery, kb, {});

                request.attributes = { ...sessionVariables };

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: kb,
                            ...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {
                    chat: {
                        followUp: "Ask something else?",
                        suggestionChips: []
                    }
                });

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_GENERATED_NO_ANSWER");
                expect(response.displays).to.have.length(0);

                expect(typeof response.outputSpeech).to.equal("object");
                if (typeof response.outputSpeech === "object") {
                    expect(response.outputSpeech.displayText).to.equal("This is not the answer\n\nAsk something else?");
                    expect(response.outputSpeech.suggestions).to.have.length(0);
                }

                expect(typeof response.reprompt).to.equal("object");
                if (typeof response.reprompt === "object") {
                    expect(response.reprompt.displayText).to.equal("Ask something else?");
                }
            });
        });
        describe("for just list of results", () => {
            it("returns as expected", () => {

                const sessionVariables = generateResultVariables(request.rawQuery, REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult, {});

                request = REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ;
                request.attributes = { ...sessionVariables };

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
        describe("for just a mix of Docs FAQs", () => {
            it("returns as expected", () => {

                request = REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ;

                const kbResult = { ...REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult };
                kbResult.faqs = [
                    {
                        question: "What is the meaning of life?",
                        document: "42"
                    }
                ]

                const sessionVariables = generateResultVariables(request.rawQuery, kbResult, {});

                request.attributes = { ...sessionVariables };

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult,
                            //...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {});

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_LIST_OF_RESULTS");

                const list = response?.displays[0];
                expect(list).to.exist;
                expect(isList(list)).to.be.true;

                if (isList(list)) {
                    expect((list as List).type).to.equal("LIST");
                    const items = list.items;

                    //  console.log(items);

                    expect(items).to.have.length(3);
                    const item = list.items[0];
                    expect(item.title).to.equal("What is the meaning of life?");
                    expect(item.description).to.equal("42");
                    expect(item.url).to.not.exist;

                    const item2 = list.items[1];

                    expect(item2.title).to.equal("Moving from an Apartment to a House Checklist | Travelers Insurance");
                    expect(item2.description).to.not.exist;
                    expect(item2.url).to.exist;
                }
            });
        });
        describe("for just FAQs", () => {
            it("returns as expected", () => {


                request = REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ;

                const kbResult = { ...REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult };
                kbResult.documents = [];
                kbResult.faqs = [
                    {
                        question: "What is the meaning of life?",
                        document: "42"
                    }
                ];

                const sessionVariables = generateResultVariables(request.rawQuery, kbResult, {});

                request.attributes = { ...sessionVariables };

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult,
                            // ...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {});

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_LIST_OF_RESULTS");

                const list = response?.displays[0];
                expect(list).to.exist;
                expect(isList(list)).to.be.true;
                if (isList(list)) {
                    expect((list as List).type).to.equal("LIST");
                    const items = list.items;
                    expect(items).to.have.length(1);
                    const item = list.items[0];
                    expect(item.title).to.equal("What is the meaning of life?");
                    expect(item.description).to.equal("42");
                }
            });
        });
        describe("with CHAT_RESPONSE variables", () => {
            it("returns as expected", () => {

                const sessionVariables = { ...VARIABLES_WITH_CHAT };

                request = new IntentRequestBuilder().withRawQuery("what is the answer").withIntentId("OCSearch").withAttributes({ ...sessionVariables }).build();

                context = new ContextBuilder()
                    .withSessionData({
                        id: "foo",
                        data: {
                            [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult,
                            //...sessionVariables
                        }
                    })
                    .build();

                const response = generateDefaultResponse(request, context, {});

                expect(response).to.exist;
                expect(response.tag).to.equal("KB_CHAT_RESPONSE");
                expect(response.displays).to.have.length(0);

                expect(typeof response.outputSpeech).to.equal("object");
                if (typeof response.outputSpeech === "object") {
                    expect(response.outputSpeech.displayText).to.include("Michael Myers has a Bachelor of Science");
                    expect(response.outputSpeech.displayText).to.include("Any other questions?");
                    expect(response.outputSpeech.suggestions).to.have.length(1);
                    expect(response.outputSpeech.suggestions[0]).to.deep.equal({ title: "Read more", url: "https://xapp.ai/about" });
                }
            });
            describe("with a follow up question already on the text", () => {
                it("returns as expected", () => {

                    const sessionVariables = { ...VARIABLES_WITH_CHAT_AND_FOLLOW_UP };

                    request = new IntentRequestBuilder().withRawQuery("what is the answer").withIntentId("OCSearch").withAttributes({ ...sessionVariables }).build();

                    context = new ContextBuilder()
                        .withSessionData({
                            id: "foo",
                            data: {
                                [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult,
                                // old method
                                // ...sessionVariables
                            }
                        })
                        .build();

                    const response = generateDefaultResponse(request, context, {});

                    expect(response).to.exist;
                    expect(response.tag).to.equal("KB_CHAT_RESPONSE");
                    expect(response.displays).to.have.length(0);

                    expect(typeof response.outputSpeech).to.equal("object");
                    if (typeof response.outputSpeech === "object") {
                        expect(response.outputSpeech.displayText).to.include("**Michael Myers** has a Bachelor of Science");
                        expect(response.outputSpeech.displayText).to.include("Anything else you want to know about him?");

                        expect(response.outputSpeech.displayText).to.include("**Michael Myers** has a Bachelor of Science degree from the University of Virginia.\n\nAnything else you want to know about him?");
                        expect(response.outputSpeech.ssml).to.include("Michael Myers has a Bachelor of Science");
                        expect(response.outputSpeech.ssml).to.include("Anything else you want to know about him?");
                        expect(response.outputSpeech.suggestions).to.have.length(1);
                        expect(response.outputSpeech.suggestions[0]).to.deep.equal({ title: "Read more", url: "https://xapp.ai/about" });
                    }
                });
            });
        })
    });
});