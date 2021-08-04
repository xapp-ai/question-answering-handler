/*! Copyright (c) 2021, XAPP AI */
import { Device, existsAndNotEmpty, ListItem, Response, ResponseBuilder } from "stentor";
import {
    KnowledgeBaseFAQ,
    KnowledgeBaseSuggested,
    KnowledgeBaseDocument
} from "stentor-models";
import { cleanAnswer } from "./cleanAnswer";
import { generateTextFragmentURL } from "./generateTextFragmentURL";
import { isFaq, isSuggested } from "./guards";

export interface RendererProps {
    device: Device;
}

export class Renderer {

    private device: Device

    public constructor(props: RendererProps) {
        this.device = props.device;
    }

    public render(answer: KnowledgeBaseFAQ | KnowledgeBaseSuggested | KnowledgeBaseDocument): Response {

        const { device } = this;

        const builder: ResponseBuilder = new ResponseBuilder({ device });

        // Voice output based channels
        if (device?.canSpeak) {
            // We only return high confidence or FAQs here on voice based channels.
            if (isSuggested(answer)) {
                builder.say(`${cleanAnswer(answer.topAnswer)}\nAny other questions?`).reprompt(`Any other questions?`);
                return;
            } else if (isFaq(answer)) {
                // The document here is the answer in the faq
                builder.say(`${cleanAnswer(answer.document)}\nAny other questions?`).reprompt(`Any other questions?`);
                return;
            }
        } else {

            if (answer) {
                // This is text based channel, we can provide more answer
                if (isSuggested(answer)) {
                    builder.say(`${cleanAnswer(answer.topAnswer)}\nAny other questions?`).reprompt(`Any other questions?`);
                } else if (isFaq(answer)) {
                    // The document here is the answer IN THE faq
                    builder.say(`${cleanAnswer(answer.document)}\nAny other questions?`).reprompt(`Any other questions?`);
                } else {
                    // here is what i found...
                    builder.say(`Here is what I found...\n"${cleanAnswer(answer.document)}"\nAny other questions?`).reprompt(`Any other questions?`);
                }
                // Add the suggestion chip if they have a URI
                if (answer.uri && (answer.uri.startsWith("https://") || answer.uri.startsWith("http://"))) {
                    builder.withSuggestions({ title: "Read More", url: generateTextFragmentURL(answer.uri, answer.document) });
                }
            } else if (existsAndNotEmpty(request.knowledgeBaseResult.documents)) {
                // Display a list of documents
                const items: ListItem[] = request.knowledgeBaseResult.documents.map((doc, index) => {

                    const description: string = cleanAnswer(doc.document);

                    return {
                        title: doc.title,
                        description,
                        url: doc.uri,
                        token: `${index}`
                    }
                });

                builder.say(`Here is what I found...`).withList(items.slice(0, 5));
            }
        }
    }
}