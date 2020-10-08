/*! Copyright (c) 2020, XAPP AI */
import { AbstractHandler, Context, isIntentRequest, keyFromRequest, Request } from "stentor";
import { log } from "stentor-logger";

/**
 * Custom handler for Question Answering
 */
export class QuestionAnsweringHandler extends AbstractHandler {

    public async start(request: Request, context: Context): Promise<void> {

        log().debug(`${this.name} start()`);
        log().debug(JSON.stringify(request, undefined, 2));

        if (isIntentRequest(request)) {

            if (request.knowledgeAnswer) {
                let response = "Sorry, I don't know that one";
                if (request.knowledgeAnswer.matchConfidence === 1) {
                    response = `${request.knowledgeAnswer.answer}`;
                } else if (request.knowledgeAnswer.matchConfidence === 0.5) {
                    response = `${request.knowledgeAnswer.answer}`
                }

                context.response.say(`${response}.  Any other questions?`).reprompt(`Any other questions?`);
                return;
            }
        }
        // Implement the start method.
        context.response.say(`I'm sorry, I don't know that one.  What else can I help you with?`).reprompt('What else can I help you with?');
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