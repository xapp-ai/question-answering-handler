/*! Copyright (c) 2023, XAPP AI */

/**
 * Typically generated from Knowledgebase result documents, specifically for setting as session variables so they can be easily accessed in the response.
 */
export interface ResultVariableInformation {
    text?: string;
    markdownText?: string;
    source?: string;
}

export interface ResultVariableGeneratedInformation extends ResultVariableInformation {
    sources?: {
        title?: string;
        url?: string;
    }[];
}

export interface ResultVariableFAQInformation extends ResultVariableInformation {
    /**
     * Optional question associated with the FAQ
     */
    question?: string;
    /**
     * If provided, redirect the user to this new handlerId which will handle the response.
     */
    handlerId?: string;
}

export interface ResultVariableListItem {
    title: string;
    document: string;
    source?: string;
}