/*! Copyright (c) 2020, XAPP AI */
import { AbstractHandler, Content, Context, Data, ExecutablePath, isIntentRequest, keyFromRequest, Request } from "stentor";
import { log } from "stentor-logger";

import { determineAnswer } from "./determineAnswer";
import { Renderer } from "./Renderer";

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

                // Compile templated response for the platform/channel etc.
                const response = new Renderer({ device: request.device }).render(answer);

                context.response.respond(response);
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

        return super.redirectingPathForRequest(request, context);
    }
}