/*! Copyright (c) 2020, XAPP AI */
import { expect } from "chai";
import { Handler } from "stentor";
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
    describe(`when passed knowledgebase results`, () => {
        describe(`documents only (no suggested or faqs)`, () => {
            describe('voice channel', () => {
                // I'm not sure.  
            });
        });
    })
})