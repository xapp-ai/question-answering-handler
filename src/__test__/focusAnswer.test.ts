/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { focusAnswer } from "../focusAnswer";

import { SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP } from "./assets/payloads";

describe(`#${focusAnswer.name}()`, () => {
    describe("without config", () => {
        it("returns the same output", () => {
            const cleaned = focusAnswer({ answer: "\n\n\n\tHello!", highlights: [{ beginOffset: 9, endOffset: 10 }] });
            expect(cleaned).to.exist;
            expect(cleaned.answer).to.equal("\n\n\n\tHello!");
            expect(cleaned.highlights).to.deep.equal([{ beginOffset: 9, endOffset: 10 }]);
        });
    });
    describe("with config", () => {
        it("removes the extra lines", () => {

            const result = SUGGESTED_WITH_HIGHLIGHTS_NOT_TOP.knowledgeBaseResult;
            const answer = result.suggested[0].document;

            const cleaned = focusAnswer(
                {
                    answer,
                    highlights: [
                        {
                            "beginOffset": 1120,
                            "endOffset": 1136
                        },
                        {
                            "beginOffset": 1239,
                            "endOffset": 1242
                        }
                    ]
                }, { REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS: true });

            expect(cleaned).to.exist;
            expect(cleaned.answer.substring(0, 41)).to.equal('\n            What is a home equity loan?\n');
            expect(cleaned.highlights).to.deep.equal([
                { beginOffset: 23, endOffset: 39 },
                { beginOffset: 142, endOffset: 145 }
            ]);
        });
    });
});