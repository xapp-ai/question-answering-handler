/*! Copyright (c) 2022, XAPP AI */
import { SessionStore } from "stentor-models";

export function RAG(store: SessionStore): boolean {
    return !!store.get("RAG_RESULT");
}

export function GeneralKnowledge(store: SessionStore): boolean {
    return !!store.get("GENERAL_KNOWLEDGE");
}