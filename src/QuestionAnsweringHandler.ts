/*! Copyright (c) 2020, XAPP AI */
import {
    AbstractHandler,
    Content,
    Context,
    Data,
    getResponse,
    keyFromRequest,
    log,
    Request
} from "stentor";
import { SESSION_STORAGE_KNOWLEDGE_BASE_RESULT } from "stentor-constants";
import { ExecutablePath, KnowledgeBaseResult } from "stentor-models";
import { MacroMap } from "stentor-utils";

import { DEFAULT_RESPONSES } from "./constants";
import { generateResultVariables, ResultVariables, ResultVariablesConfig } from "./generateResultVariables";
import { GeneralKnowledge, RAG } from "./macros";

const RESULT_VARIABLE_KEYS: (keyof ResultVariables)[] = ["TOP_FAQ", "TOP_ANSWER", "SUGGESTED_ANSWER", "SEARCH_RESULTS", "RAG_RESULT", "GENERAL_KNOWLEDGE", "GENERATED_NO_ANSWER"];

export interface QuestionAnsweringData extends Data, ResultVariablesConfig { }

/**
 * Custom handler for Question Answering
 */
export class QuestionAnsweringHandler<C extends Content = Content, D extends QuestionAnsweringData = QuestionAnsweringData> extends AbstractHandler<C, D> {

    public name = "QuestionAnsweringHandler";

    public async handleRequest(request: Request, context: Context): Promise<void> {

        log().debug(`${this.name} handleRequest()`);
        log().debug(JSON.stringify(request, undefined, 2));

        // We want to communicate the result.
        // There should already be one set on the session storage by the dialog manager
        const result: KnowledgeBaseResult = context.session.get(SESSION_STORAGE_KNOWLEDGE_BASE_RESULT);
        // Generate the variables that will be injected!
        const variables = generateResultVariables(request.rawQuery, result, this.data);
        // For each variable, we drop them on the session variable
        RESULT_VARIABLE_KEYS.forEach((key) => {
            const value = variables[key];
            context.session.set(key, value);
        });

        log().debug('Variables');
        log().debug(JSON.stringify(variables, undefined, 2));

        // Generate some macros that make it easier to use
        // testing these out for fun.
        const macros: MacroMap = {
            GeneralKnowledge: GeneralKnowledge.bind(this, context.session),
            RAG: RAG.bind(this, context.session)
        }

        const key = keyFromRequest(request);

        switch (key) {
            case this.intentId:

                let response = getResponse(this, request, context, {}, macros);

                if (!response) {
                    response = getResponse(DEFAULT_RESPONSES, request, context, {}, macros)
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

    public async redirectingPathForRequest(request: Request, context: Context): Promise<ExecutablePath> {
        // There should already be one set on the session storage by the dialog manager
        const result: KnowledgeBaseResult = context.session.get(SESSION_STORAGE_KNOWLEDGE_BASE_RESULT);
        // Generate the variables that will be injected!
        const variables = generateResultVariables(request.rawQuery, result, this.data);
        // For each variable, we drop them on the session variable
        RESULT_VARIABLE_KEYS.forEach((key) => {
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