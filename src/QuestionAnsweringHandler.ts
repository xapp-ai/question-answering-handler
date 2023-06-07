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
import { S3 } from "aws-sdk";

import { DEFAULT_RESPONSES } from "./constants";
import { generateResultVariables, ResultVariables, ResultVariablesConfig } from "./generateResultVariables";

const RESULT_VARIABLE_KEYS: (keyof ResultVariables)[] = ["TOP_FAQ", "TOP_ANSWER", "SUGGESTED_ANSWER", "SEARCH_RESULTS"];
const MEDIA_EXTENSIONS: string[] = [".MP3", ".WAV", ".MP4", ".WEBM"];

export interface KnowledgeBaseResultWithMedia extends KnowledgeBaseResult {
    mediaFile?: boolean;
}

export interface QuestionAnsweringData extends Data, ResultVariablesConfig { }

/**
 * Custom handler for Question Answering
 */
export class QuestionAnsweringHandler<C extends Content = Content, D extends QuestionAnsweringData = QuestionAnsweringData> extends AbstractHandler<C, D> {

    public name = "QuestionAnsweringHandler";
    private media = false;
    private mediaFile = "";

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


        const key = keyFromRequest(request);

        switch (key) {
            case this.intentId:
                this.media = false;
                // We want to communicate the result.
                // There should already be one set on the session storage by the dialog manager
                const result: KnowledgeBaseResultWithMedia = context.session.get(SESSION_STORAGE_KNOWLEDGE_BASE_RESULT);
                // Generate the variables that will be injected!
                const variables = generateResultVariables(request.rawQuery, result, this.data);
                // For each variable, we drop them on the session variable
                RESULT_VARIABLE_KEYS.forEach((key) => {
                    var value = variables[key];
                    // Update media links
                    value = this.handleMedia(key, value, context);
                    context.session.set(key, value);
                });

                log().debug('Variables');
                log().debug(JSON.stringify(variables, undefined, 2));

                let response = getResponse(this, request, context);

                if (!response) {
                    response = getResponse(DEFAULT_RESPONSES, request, context)
                }

                // Add display if media exist
                if (this.media)
                    context.response.respond(response).withDisplay({
                        type: "Media", // audio and video component
                        src: this.mediaFile, 
                        index: 0,
                    });
                else context.response.respond(response);
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

    public handleMedia(key: string, result: any, context: Context) {
        if (!result) return;

        // sign media urls in list
        if (key == "SEARCH_RESULTS") {

            const MAX = 3;
            result.forEach((item: any,index: number) => {

                if (index >= MAX) return;
                
                let match = MEDIA_EXTENSIONS.filter(s => s.includes(item.source.toUpperCase()))

                if (match) 
                    item = this.processMediaResult(item.document,item);
                
            });

        } 
        // display a media response
        else {
            if (MEDIA_EXTENSIONS.filter(s => s.includes(result.source.toUpperCase()))) {
                this.media = true;
                result.mediaFile = this.media = true;
                result = this.processMediaResult(result.text,result);
                this.mediaFile = result.source;
            }
        }

        return result;
    }

    private processMediaResult(text:string,item: any) {
        
        // 1.  Set offset to start at indexed position
        // 2.  Sign url
        const answerText = text;
        const mm = answerText!.indexOf("[");
        const nn = answerText!.indexOf("]", mm);
        let offset = answerText!.substring(mm + 1, nn);
        item.source = item.source.substring(0, item.source.indexOf("#"));
        item = this.signUrl(item);
        item.source = item.source + "#t=" + offset;
        return item;
    }

    public signUrl(result: any): string {
        try {
            const s3 = new S3();
            s3.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            });

            var bucket = "";
            var key = "";
            if (result.source.search(/\/s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/) !== -1) {
                //bucket in path format
                bucket = result.source.split("/")[3];
                key = result.source.split("/").slice(4).join("/");
            }
            if (result.source.search(/\.s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/) !== -1) {
                //bucket in hostname format
                let hostname = result.source.split("/")[2];
                bucket = hostname.split(".")[0];
                key = result.source.split("/").slice(3).join("/");
            }

            if (bucket && key) {
                //The URI points to an object in an S3 bucket
                //Get presigned url from s3
                console.log("Attempt to convert S3 url to a signed URL: ", result.source);
                console.log("Bucket: ", bucket, " Key: ", key);
                let params = { Bucket: bucket, Key: key };
                let url = s3!.getSignedUrl("getObject", params);
                result.source = url;
                console.debug("Signed URL: ", url);
            } else {
                console.log("URL is not an S3 url - return unchanged: ", result.source);
            }
        } catch {
            // Just do nothing, so the documentURI are still as before
            console.log("Error signing S3 URL (returning original URL): ", result.source);
        }

        return result;
    }
}