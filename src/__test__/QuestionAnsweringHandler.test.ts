/*! Copyright (c) 2020, XAPP AI */
import { expect } from "chai";
import { Context, Handler, IntentRequest } from "stentor";

import { IntentRequestBuilder } from "stentor-request";
import { ContextBuilder } from "stentor-context";

import { RESULT_WITH_NEWLINES, REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ, REQUEST_KB_NO_SUGGEST_OR_FAQ_2 } from "./assets/payloads";

import { QuestionAnsweringHandler } from "../QuestionAnsweringHandler";

const handler: Handler = {
    appId: "appId",
    organizationId: "organizationId",
    intentId: "intentId",
    type: "QuestionAnsweringHandler",
    content: {
        ["intentId"]: [{ outputSpeech: "${}" }]
    }
}

describe(`${QuestionAnsweringHandler.name}`, () => {
    describe(`#constructor()`, () => {
        it('returns an instance of itself', () => {
            expect(new QuestionAnsweringHandler(handler)).to.be.instanceOf(QuestionAnsweringHandler);
        });
    });
    describe(`${QuestionAnsweringHandler.prototype.handleRequest.name}()`, () => {
        let request: IntentRequest
        let context: Context;
        beforeEach(() => {
            request = new IntentRequestBuilder().build();
            context = new ContextBuilder().build();
        })
        let qa: QuestionAnsweringHandler;
        beforeEach(() => {
            qa = new QuestionAnsweringHandler(handler);
        });
        describe(`when passed request without knowledgebase results`, () => {
            it("returns the correct response", () => {
                qa.handleRequest(request, context);
                const response = context.response.response;
                expect(response).to.exist;
                expect(response.outputSpeech.ssml).to.contain("I'm sorry, I don");
            });
        });
        describe('when passed request with knowledgebase results', () => {
            it('returns the correct response', () => {
                qa.handleRequest({
                    ...request,
                    rawQuery: "what is an overdraft",
                    knowledgeBaseResult: RESULT_WITH_NEWLINES
                }, {
                    ...context,
                    device: {
                        ...context.device,
                        canSpeak: false
                    }
                });
                const response = context.response.response;
                expect(response).to.exist;
                expect(response.outputSpeech.ssml).to.contain("An overdraft occurs");
                expect(response.outputSpeech.suggestions[0]).to.deep.equal({
                    title: 'Read More',
                    url:
                        'https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/glossary#:~:text=OverdraftAn%20overdraft%20occurs,paycheck%20on.'
                });
            });
        });
        describe('when passed knowledgebase results without faq or suggested', () => {
            it("returns the correct response", () => {
                qa.handleRequest(REQUEST_KNOWLEDGEBASE_NO_SUGGEST_OR_FAQ, context);
                const response = context.response.response;
                expect(response).to.exist;
                expect(response.outputSpeech.ssml).to.contain("I'm sorry, I don");
            });
            describe("when passed crashing payload", () => {
                it("returns the correct response", () => {
                    qa.handleRequest(REQUEST_KB_NO_SUGGEST_OR_FAQ_2, context);
                    const response = context.response.response;
                    expect(response).to.exist;
                    expect(response.outputSpeech.ssml).to.contain("I'm sorry, I don");
                });
            });
        });

    });
});