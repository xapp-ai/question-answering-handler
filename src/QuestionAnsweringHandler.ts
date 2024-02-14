/*! Copyright (c) 2020, XAPP AI */
import {
    AbstractHandler,
    Content,
    Context,
    Data,
    getResponse,
    isInputUnknownRequest,
    isIntentRequest,
    keyFromRequest,
    log,
    Request
} from "stentor";
import { SESSION_STORAGE_KNOWLEDGE_BASE_RESULT } from "stentor-constants";
import { ExecutablePath, KnowledgeBaseResult, SuggestionTypes } from "stentor-models";
import { MacroMap } from "stentor-utils";

import { QUESTION_ANSWERING_HANDLER_TYPE } from "./constants";
import { generateResultVariables, ResultVariables, ResultVariablesConfig, } from "./generateResultVariables";
import { generateDefaultResponse } from "./generateDefaultResponse";
import { GeneralKnowledge, RAG } from "./macros";

const RESULT_VARIABLE_KEYS: (keyof ResultVariables)[] = ["TOP_FAQ", "TOP_ANSWER", "SUGGESTED_ANSWER", "SEARCH_RESULTS", "RAG_RESULT", "GENERAL_KNOWLEDGE", "GENERATED_NO_ANSWER"];

export interface QuestionAnsweringData extends Data, ResultVariablesConfig {

    /**
     * Optional Chat Configuration
     */
    chat?: {
        /**
         * Chips to use when generating the default responses.  These will not be added to any overridden responses
         */
        suggestionChips?: SuggestionTypes[];
        /**
         * The follow up question after the knowledgebase result content.  It can be an empty string to omit it.
         */
        followUp?: string;
        /**
         * Experimental feature to include search results when we have a GENERATED_NO_ANSWER.  
         */
        includeResultsInNoAnswer?: number;
    };
    /**
     * Optional Search Configuration
     */
    search?: {
        /**
         * Provides the ability to override the default labels on the search channel
         */
        topLabels?: {
            FAQ: string;
            SUGGESTED: string;
            GENERAL_KNOWLEDGE: string;
            AI_ANSWER: string;
        };
        /**
         * Optional configuration setting for the number of search results on intelligent search channel.
         */
        numberOfResults?: number;
    };
}

/**
 * Custom handler for Question Answering
 */
export class QuestionAnsweringHandler<C extends Content = Content, D extends QuestionAnsweringData = QuestionAnsweringData> extends AbstractHandler<C, D> {

    public static readonly TYPE: string = QUESTION_ANSWERING_HANDLER_TYPE;

    public name = "QuestionAnsweringHandler";

    public async handleRequest(request: Request, context: Context): Promise<void> {

        log().info(`${this.name} handleRequest({type:${request.type} intentId:${isInputUnknownRequest(request) || isIntentRequest(request) ? request.intentId : ""})`);
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

        log().info(`Variables: ${Object.keys(variables)}`);
        log().debug(JSON.stringify(variables, undefined, 2));

        // Generate some macros that make it easier to use
        // testing these out for fun.
        const macros: MacroMap = {
            GeneralKnowledge: GeneralKnowledge.bind(this, context.session),
            RAG: RAG.bind(this, context.session)
        }

        const key = keyFromRequest(request);

        switch (key) {
            case "OCSearch":
            case "KnowledgeAnswer":
            case this.intentId:

                // See if they overrode the response
                let response = getResponse(this, request, context, {}, macros);

                if (!response) {
                    response = generateDefaultResponse(request, context, this.data);
                }

                context.response.respond(response);
                break;
            default:
                // Let it fall through to the super
                // We may need to figure out how to pass through the macros for use in the super otherwise
                // we can't subclass this and get QA responses back, if we are using the macros
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