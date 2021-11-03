/*! Copyright (c) 2020, XAPP AI */
import {
    AbstractHandler,
    Content,
    Context,
    Data,
    getResponse,
    keyFromRequest,
    Request
} from "stentor";
import { SESSION_STORAGE_KNOWLEDGE_BASE_RESULT } from "stentor-constants";
import { ExecutablePath, KnowledgeBaseResult } from "stentor-models";
import { log } from "stentor-logger";

import { DEFAULT_RESPONSES } from "./constants";
import { generateResultVariables, ResultVariables, ResultVariablesConfig } from "./generateResultVariables";


export interface QuestionAnsweringData extends Data, ResultVariablesConfig { }

/**
 * Custom handler for Question Answering
 */
export class QuestionAnsweringHandler extends AbstractHandler<Content, QuestionAnsweringData> {

    public name = "QuestionAnsweringHandler";

    public async handleRequest(request: Request, context: Context): Promise<void> {

        log().debug(`${this.name} handleRequest()`);
        log().debug(JSON.stringify(request, undefined, 2));

        const key = keyFromRequest(request);

        switch (key) {
            case this.intentId:
                // We want to communicate the result.
                // There should already be one set on the session storage by the dialog manager
                const result: KnowledgeBaseResult = context.session.get(SESSION_STORAGE_KNOWLEDGE_BASE_RESULT);
                // Generate the variables that will be injected!
                const variables = generateResultVariables(request.rawQuery, result, this.data);
                // For each variable, we drop them on the session variable
                Object.keys(variables).forEach((key: keyof ResultVariables) => {
                    const value = variables[key];
                    context.session.set(key, value);
                });

                let response = getResponse(this, request, context);

                if (!response) {
                    response = getResponse(DEFAULT_RESPONSES, request, context)
                }

                context.response.respond(response);
                break;
            default:
                // Let it fall through to the super
                return super.handleRequest(request, context);
        }
    }

    public canHandleRequest(request: Request, context: Context): boolean {
        return super.canHandleRequest(request, context);
    }

    public redirectingPathForRequest(request: Request, context: Context): ExecutablePath {
        // There should already be one set on the session storage by the dialog manager
        const result: KnowledgeBaseResult = context.session.get(SESSION_STORAGE_KNOWLEDGE_BASE_RESULT);
        // Generate the variables that will be injected!
        const variables = generateResultVariables(request.rawQuery, result, this.data);
        // For each variable, we drop them on the session variable
        Object.keys(variables).forEach((key: keyof ResultVariables) => {
            const value = variables[key];
            context.session.set(key, value);
        });

        if (variables.TOP_FAQ && variables.TOP_FAQ.handlerId) {
            return {
                type: "START",
                intentId: variables.TOP_FAQ.handlerId
            }
        }

        return super.redirectingPathForRequest(request, context);
    }
}