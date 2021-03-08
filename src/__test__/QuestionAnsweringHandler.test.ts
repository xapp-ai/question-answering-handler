/*! Copyright (c) 2020, XAPP AI */
import { expect } from "chai";
import { Context, Handler, IntentRequest } from "stentor";

import { IntentRequestBuilder } from "stentor-request";
import { ContextBuilder } from "stentor-context";

import { RESULT_WITH_NEWLINES } from "./assets/payloads";

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

const request: IntentRequest = new IntentRequestBuilder().build();

const context: Context = new ContextBuilder().build();

describe(`${QuestionAnsweringHandler.name}`, () => {
    describe(`#constructor()`, () => {
        it('returns an instance of itself', () => {
            expect(new QuestionAnsweringHandler(handler)).to.be.instanceOf(QuestionAnsweringHandler);
        });
    });
    describe(`${QuestionAnsweringHandler.prototype.handleRequest.name}()`, () => {
        let qa: QuestionAnsweringHandler;
        beforeEach(() => {
            qa = new QuestionAnsweringHandler(handler);
        });
        describe(`when passed request without knowledgebase results`, () => {
            it("returns the correct response", () => {
                qa.handleRequest(request, context);
                const response = context.response.response;
                expect(response).to.exist;
                expect(response.outputSpeech.ssml).to.contain("I'm sorry");
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
                        'https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/glossary'
                });
            });
        });
    });
});