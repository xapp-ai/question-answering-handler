/*! Copyright (c) 2020, XAPP AI */
import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

chai.use(sinonChai);
const expect = chai.expect;

import { Content, Context, List, Handler, IntentRequest, ResponseBuilder, Response, ResponseOutput } from "stentor";
import { SESSION_STORAGE_KNOWLEDGE_BASE_RESULT } from "stentor-constants";
import { IntentRequestBuilder } from "stentor-request";
import { ContextBuilder } from "stentor-context";

import {
    RESULT_WITH_NEWLINES,
    REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ,
    REQUEST_KB_NO_SUGGEST_OR_FAQ_2,
    REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER
} from "./assets/payloads";

import { QuestionAnsweringHandler, QuestionAnsweringData } from "../QuestionAnsweringHandler";

const handler: Handler = {
    appId: "appId",
    organizationId: "organizationId",
    intentId: "OCSearch",
    type: "QuestionAnsweringHandler",
    content: {}
}

const handlerWithContent: Handler<Content, QuestionAnsweringData> = {
    appId: "appId",
    organizationId: "organizationId",
    intentId: "OCSearch",
    type: "QuestionAnsweringHandler",
    data: {
        QNA_BOT_LONGEST_HIGHLIGHT: true
    },
    content: {
        ["OCSearch"]: [
            {
                outputSpeech: {
                    ssml: "${TOP_ANSWER.text}",
                    displayText: "Here is the top answer: ${TOP_ANSWER.text}",
                    suggestions: [{ title: "Source", url: "${TOP_ANSWER.source}" }]
                },
                conditions: "!!session('TOP_ANSWER')",
            },
            {
                outputSpeech: {
                    ssml: "${SUGGESTED_ANSWER.text}",
                    displayText: "${SUGGESTED_ANSWER.text}"
                },
                conditions: "!!session('SUGGESTED_ANSWER') && !session('TOP_ANSWER')"
            }
        ],
        ["YesIntent"]: [
            {
                outputSpeech: {
                    ssml: "Yes",
                    displayText: "Yes",
                },
                reprompt: {
                    ssml: "Yes?",
                    displayText: "Yes?"
                }
            }
        ]
    }
}

describe(`${QuestionAnsweringHandler.name}`, () => {
    describe(`#constructor()`, () => {
        it('returns an instance of itself', () => {
            expect(new QuestionAnsweringHandler(handler)).to.be.instanceOf(QuestionAnsweringHandler);
        });
    });
    describe(`${QuestionAnsweringHandler.prototype.handleRequest.name}()`, () => {

        let qa: QuestionAnsweringHandler;
        let response: ResponseBuilder;
        let request: IntentRequest
        let context: Context;
        // This tests the scenario where there is no content defined
        // which was common on earlier versions
        describe("without defined content", () => {
            beforeEach(() => {
                request = new IntentRequestBuilder()
                    .withIntentId(handler.intentId)
                    .updateDevice({
                        canSpeak: false
                    }).build();
                context = new ContextBuilder().withDevice(request.device).withSessionData({ id: "foo", data: {} }).build();
                qa = new QuestionAnsweringHandler(handler);
            });
            describe(`when passed request without knowledgebase results`, () => {
                it("returns the correct response", async () => {
                    await qa.handleRequest(request, context);
                    const response = context.response.response;
                    expect(response).to.exist;
                    expect(response.outputSpeech).to.exist;
                    expect(response.outputSpeech.ssml).to.contain("I'm sorry, I don");
                });
            });
            describe('when passed request with knowledgebase results', () => {
                it('returns the correct response', async () => {

                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore The stubbed instance types can't see the private properties, which cause TS errors
                    response = sinon.createStubInstance(ResponseBuilder);

                    await qa.handleRequest(
                        new IntentRequestBuilder()
                            .withIntentId(handler.intentId)
                            .updateDevice({ canSpeak: false })
                            .withRawQuery("what is an overdraft")
                            .withKnowledgeBaseResult(RESULT_WITH_NEWLINES).build(),
                        new ContextBuilder()
                            .withResponse(response)
                            .withSessionData({
                                id: "foo",
                                data: {
                                    [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: RESULT_WITH_NEWLINES
                                }
                            })
                            .build()
                    );

                    expect(response.respond).to.have.been.calledOnce;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore Need the call, types aren't great here with sinon
                    const output: Response<ResponseOutput> = response.respond.getCall(0).args[0];

                    expect(output).to.exist;
                    expect(output.outputSpeech).to.exist;
                    expect(output.outputSpeech.ssml).to.contain("An overdraft occurs");
                    expect(output.outputSpeech.suggestions[0]).to.deep.equal({
                        title: 'Read More',
                        url:
                            'https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/glossary'
                    });
                });
            });
            describe('when passed knowledgebase results without faq or suggested', () => {
                it("returns the correct response", async () => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore The stubbed instance types can't see the private properties, which cause TS errors
                    response = sinon.createStubInstance(ResponseBuilder);

                    request = new IntentRequestBuilder()
                        .withRawQuery('hot dogs')
                        .withIntentId(handler.intentId)
                        .updateDevice({
                            canSpeak: false
                        })
                        .withKnowledgeBaseResult(REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult)
                        .build();

                    context = new ContextBuilder()
                        .withResponse(response)
                        .withSessionData({
                            id: "foo",
                            data: {
                                [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult
                            }
                        })
                        .build()

                    await qa.handleRequest(request, context);

                    expect(response.respond).to.have.been.calledOnce;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore Need the call, types aren't great here with sinon
                    const output: Response<ResponseOutput> = response.respond.getCall(0).args[0];

                    expect(output).to.exist;

                    expect(output.outputSpeech.displayText).to.contain("Here is what I found...");
                    expect(output.displays).to.have.length(1);
                    const list = output.displays[0] as List;
                    expect(list.type).to.equal("LIST");
                    expect(list.items).to.have.length(3);
                    const item = list.items[0];
                    expect(item.title).to.exist;
                    expect(item.title).to.equal("Moving from an Apartment to a House Checklist | Travelers Insurance");
                    expect(item.description).to.exist;
                    expect(item.url).to.exist;
                    expect(item.url).to.equal("https://www.travelers.com/resources/home/moving/moving-from-an-apartment-to-a-house-checklist");
                });
                describe("for voice devices", () => {
                    beforeEach(() => {
                        qa = new QuestionAnsweringHandler(handler);
                    });
                    it("returns the correct response", async () => {

                        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                        // @ts-ignore The stubbed instance types can't see the private properties, which cause TS errors
                        response = sinon.createStubInstance(ResponseBuilder);

                        request = new IntentRequestBuilder()
                            .withRawQuery('hot dogs')
                            .withIntentId(handler.intentId)
                            .updateDevice({
                                canSpeak: true
                            })
                            .withKnowledgeBaseResult(REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult)
                            .build();

                        context = new ContextBuilder()
                            .withResponse(response)
                            .withSessionData({
                                id: "foo",
                                data: {
                                    [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ.knowledgeBaseResult
                                }
                            })
                            .build()

                        await qa.handleRequest(request, context);

                        expect(response.respond).to.have.been.calledOnce;
                        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                        // @ts-ignore Need the call, types aren't great here with sinon
                        const output: Response<ResponseOutput> = response.respond.getCall(0).args[0];

                        expect(output).to.exist;
                        expect(output.outputSpeech.ssml).to.contain("I'm sorry, I don");
                    });
                });
                describe("when passed crashing payload", () => {
                    it("returns the correct response", async () => {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                        // @ts-ignore The stubbed instance types can't see the private properties, which cause TS errors
                        response = sinon.createStubInstance(ResponseBuilder);

                        request = new IntentRequestBuilder()
                            .withRawQuery('hot dogs')
                            .withIntentId(handler.intentId)
                            .updateDevice({
                                canSpeak: false
                            })
                            .withKnowledgeBaseResult(REQUEST_KB_NO_SUGGEST_OR_FAQ_2.knowledgeBaseResult)
                            .build();

                        context = new ContextBuilder()
                            .withResponse(response)
                            .withSessionData({
                                id: "foo",
                                data: {
                                    [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_KB_NO_SUGGEST_OR_FAQ_2.knowledgeBaseResult
                                }
                            })
                            .build()

                        await qa.handleRequest(request, context);

                        expect(response.respond).to.have.been.calledOnce;
                        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                        // @ts-ignore Need the call, types aren't great here with sinon
                        const output: Response<ResponseOutput> = response.respond.getCall(0).args[0];

                        expect(output).to.exist;

                        expect(output.outputSpeech.displayText).to.contain("Here is what I found...");
                    });
                });
            });
        });
        describe("with content", () => {
            describe('when passed request with knowledgebase results', () => {
                beforeEach(() => {
                    qa = new QuestionAnsweringHandler(handlerWithContent);
                });
                it('returns the correct response', async () => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore The stubbed instance types can't see the private properties, which cause TS errors
                    response = sinon.createStubInstance(ResponseBuilder);

                    request = new IntentRequestBuilder()
                        .withRawQuery('hot dogs')
                        .withIntentId(handler.intentId)
                        .updateDevice({
                            canSpeak: false
                        })
                        .withKnowledgeBaseResult(REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult)
                        .build();

                    context = new ContextBuilder()
                        .withResponse(response)
                        .withSessionData({
                            id: "foo",
                            data: {
                                [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult
                            }
                        })
                        .build()

                    await qa.handleRequest(request, context);

                    expect(response.respond).to.have.been.calledOnce;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore Need the call, types aren't great here with sinon
                    const output: Response<ResponseOutput> = response.respond.getCall(0).args[0];

                    expect(output).to.exist;

                    expect(output.outputSpeech.ssml).to.contain("Inflation is a general upward");
                    expect(output.outputSpeech.displayText).to.contain("Here is the top answer: Inflation is a general upward");
                    expect(output.outputSpeech.suggestions[0]).to.deep.equal({
                        title: 'Source',
                        url: 'https://investor.gov/introduction-investing/basics/investment-products/bonds'
                    });
                });
            });
            describe('when passed other requests', () => {
                beforeEach(() => {
                    qa = new QuestionAnsweringHandler(handlerWithContent);
                });
                it('returns the correct response', async () => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore The stubbed instance types can't see the private properties, which cause TS errors
                    response = sinon.createStubInstance(ResponseBuilder);

                    request = new IntentRequestBuilder()
                        .withRawQuery('yes')
                        .withIntentId("YesIntent")
                        .updateDevice({
                            canSpeak: false
                        })
                        .build();

                    context = new ContextBuilder()
                        .withResponse(response)
                        .withSessionData({
                            id: "foo",
                            data: {
                                [SESSION_STORAGE_KNOWLEDGE_BASE_RESULT]: REQUEST_WITH_GOOD_HIGHLIGHTED_ANSWER.knowledgeBaseResult
                            }
                        })
                        .build()

                    await qa.handleRequest(request, context);

                    expect(response.respond).to.have.been.calledOnce;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                    // @ts-ignore Need the call, types aren't great here with sinon
                    const output: Response<ResponseOutput> = response.respond.getCall(0).args[0];

                    expect(output).to.exist;
                    expect(output).to.deep.equal({
                        outputSpeech: { ssml: 'Yes', displayText: 'Yes' },
                        reprompt: { ssml: 'Yes?', displayText: 'Yes?' }
                    })
                });
            });
        });
    });
});