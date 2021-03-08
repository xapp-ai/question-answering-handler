/*! Copyright (c) 2020, XAPP AI */
import { AbstractHandler, Context, isIntentRequest, keyFromRequest, Request } from "stentor";
import { KnowledgeBaseDocument, KnowledgeBaseFAQ, KnowledgeBaseSuggested } from "stentor-models";
import { log } from "stentor-logger";
import { determineAnswer } from "./determineAnswer";


function isSuggested(answer: KnowledgeBaseFAQ | KnowledgeBaseSuggested | KnowledgeBaseDocument): answer is KnowledgeBaseSuggested {
    return !!answer && typeof (answer as KnowledgeBaseSuggested).topAnswer === "string" && (answer as KnowledgeBaseSuggested).topAnswer.length > 0
}

function isFaq(answer: KnowledgeBaseFAQ | KnowledgeBaseSuggested | KnowledgeBaseDocument): answer is KnowledgeBaseFAQ {
    return !!answer && typeof (answer as KnowledgeBaseFAQ).question === "string" && (answer as KnowledgeBaseFAQ).question.length > 0
}

/**
 * Custom handler for Question Answering
 */
export class QuestionAnsweringHandler extends AbstractHandler {

    public async start(request: Request, context: Context): Promise<void> {

        log().debug(`${this.name} start()`);

        if (isIntentRequest(request)) {

            if (request.knowledgeBaseResult) {
                const answer = determineAnswer(request.rawQuery, request.knowledgeBaseResult);
                // Voice output based channels
                if (context.device.canSpeak) {
                    // We only return high confidence or FAQs here on voice based channels.
                    if (isSuggested(answer)) {
                        context.response.say(`${answer.topAnswer}\nAny other questions?`).reprompt(`Any other questions?`);
                        return;
                    } else if (isFaq(answer)) {
                        // The document here is the answer in the faq
                        context.response.say(`${answer.document}\nAny other questions?`).reprompt(`Any other questions?`);
                        return;
                    }
                } else {
                    // This is text based channel, we can provide more answer
                    if (isSuggested(answer)) {
                        context.response.say(`${answer.topAnswer}\nAny other questions?`).reprompt(`Any other questions?`);
                    } else if (isFaq(answer)) {
                        // The document here is the answer IN THE faq
                        context.response.say(`${answer.document}\nAny other questions?`).reprompt(`Any other questions?`);
                    } else {
                        if (answer) {
                            // here is what i found...
                            context.response.say(`Here is what I found...\n"${answer.document}"\nAny other questions?`).reprompt(`Any other questions?`);
                        }
                    }

                    if (answer.uri && answer.uri.startsWith("https://") || answer.uri.startsWith("http://")) {
                        context.response.withSuggestions({ title: "Read More", url: answer.uri });
                    }

                    if (context.response.response.outputSpeech) {
                        return;
                    }
                }
            }
        }
        // We don't have an answer
        context.response.say(`I'm sorry, I don't know that one. What else can I help you with? `).reprompt('What else can I help you with?');
    }
    // The handleRequest is called 
    public async handleRequest(request: Request, context: Context): Promise<void> {

        log().debug(`${this.name} handleRequest()`);
        log().debug(JSON.stringify(request, undefined, 2));
        // 2. Write your custom logic
        const key = keyFromRequest(request);

        switch (key) {
            default:
                // Let it fall through to the super
                return this.start(request, context);
        }
    }

    public canHandleRequest(request: Request, context: Context): boolean {
        return super.canHandleRequest(request, context);
    }
}