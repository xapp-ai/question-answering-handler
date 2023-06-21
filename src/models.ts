/*! Copyright (c) 2023, XAPP AI */


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
     * If provided, redirect the user to this new handlerId which will handle the response.
     */
    handlerId?: string;
}

export interface ResultVariableListItem {
    title: string;
    document: string;
    source?: string;
}