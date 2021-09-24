/*! Copyright (c) 2020, XAPP AI */
import { AbstractHandler, Content, Context, Data, getResponse, isIntentRequest, keyFromRequest, Request } from "stentor";
import { ExecutablePath } from "stentor-models";
import { log } from "stentor-logger";

import { cleanAnswer } from "./cleanAnswer";
import { determineAnswer } from "./determineAnswer";
import { isFaq, isSuggested } from "./guards";

export interface QuestionAnsweringData extends Data {
    /**
     * If true, it will attempt to use fuzzy string matching to return the top FAQ
     */
    ["FUZZY_MATCH_FAQS"]: boolean;
    /**
     * If true, it will use the longest
     */
    ["QNA_BOT_LONGEST_HIGHLIGHT"]: boolean;
}

/**
 * Custom handler for Question Answering
 */
export class QuestionAnsweringHandler extends AbstractHandler<Content, QuestionAnsweringData> {

    public async start(request: Request, context: Context): Promise<void> {

        log().debug(`${this.name} start()`);

        if (isIntentRequest(request)) {

            if (request.knowledgeBaseResult) {

                // Determine answer
                const answer = determineAnswer(request.rawQuery, request.knowledgeBaseResult);

                let cleanedAnswer: string;

                if (isSuggested(answer)) {
                    cleanedAnswer = cleanAnswer(answer.topAnswer);
                } else if (isFaq(answer)) {
                    cleanedAnswer = cleanAnswer(answer.document);
                }

                const response = getResponse(this, request, context, { answer: cleanedAnswer });
                // We need a default response in case they don't have Q&A content
                if (!response) {

                }

                context.response.respond(response);
                return;
            }
        }
        // We don't have an answer

        // Response when we don't have any documents

        context.response.say(`I'm sorry, I don't know that one. What else can I help you with? `).reprompt('What else can I help you with?');
    }

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

    public redirectingPathForRequest(request: Request, context: Context): ExecutablePath {
        // We need to find the best answer here

        if (isIntentRequest(request) && request.knowledgeBaseResult) {
            const answer = determineAnswer(request.rawQuery, request.knowledgeBaseResult);
            if (isFaq(answer)) {
                const redirectTo = answer.handlerId
            }
        }

        return super.redirectingPathForRequest(request, context);
    }
}