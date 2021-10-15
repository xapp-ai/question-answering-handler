/*! Copyright (c) 2020, XAPP AI */
import {
    AbstractHandler,
    Content,
    Context,
    Data,
    getResponse,
    isIntentRequest,
    keyFromRequest,
    Request
} from "stentor";
// import { SESSION_STORAGE } from "stentor-constants";
import { ExecutablePath, KnowledgeBaseResult } from "stentor-models";
import { log } from "stentor-logger";

import { cleanAnswer } from "./cleanAnswer";
import { DEFAULT_UNKNOWN_RESPONSE } from "./constants";
import { determineAnswer, generateResultVariables, ResultVariables, ResultVariablesConfig } from "./determineAnswer";
import { isFaq, isSuggested } from "./guards";

export interface QuestionAnsweringData extends Data, ResultVariablesConfig { }

/**
 * Custom handler for Question Answering
 */
export class QuestionAnsweringHandler extends AbstractHandler<Content, QuestionAnsweringData> {

    public async start(request: Request, context: Context): Promise<void> {

        log().debug(`${this.name} start()`);

        // First check the super, we may have an override.

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
        context.response.respond(DEFAULT_UNKNOWN_RESPONSE);
    }

    public async handleRequest(request: Request, context: Context): Promise<void> {

        log().debug(`${this.name} handleRequest()`);
        log().debug(JSON.stringify(request, undefined, 2));
        // 2. Write your custom logic
        const key = keyFromRequest(request);

        switch (key) {

            case this.intentId:

                // We want to communicate the result.
                // There should already be one set on the session storage by the dialog manager
                const result: KnowledgeBaseResult = context.session.get("knowledge_base_result");

                const variables = generateResultVariables(request.rawQuery, result, this.data);

                // For each variable, we drop them on the session variable
                Object.keys(variables).forEach((key: keyof ResultVariables) => {
                    const value = variables[key];
                    context.session.set(key, value);
                });

                console.log(context.session.get('TOP_ANSWER'));

                console.log('variables');
                console.log(variables.TOP_ANSWER);

                const response = getResponse(this, request, context, variables);
                console.log('response');
                console.log(response);

                context.response.respond(response);
                return;
            default:
                // Let it fall through to the super
                return this.handleRequest(request, context);
        }
    }

    public canHandleRequest(request: Request, context: Context): boolean {
        return super.canHandleRequest(request, context);
    }

    /**
     * We may
     * @param request 
     * @param context 
     * @returns 
     */
    public redirectingPathForRequest(request: Request, context: Context): ExecutablePath {
        // We need to find the best answer here

        if (isIntentRequest(request) && request.knowledgeBaseResult) {
            const answer = determineAnswer(request.rawQuery, request.knowledgeBaseResult);
            if (isFaq(answer)) {
                const redirectTo = answer.handlerId;

                console.log(`redirecting to: ` + redirectTo);

                return {
                    type: "START",
                    intentId: redirectTo
                }
            }
        }

        return super.redirectingPathForRequest(request, context);
    }
}