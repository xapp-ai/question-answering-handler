/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { focusAnswer, Highlight } from "../focusAnswer";
import { addMarkdownHighlights } from "../utils";

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
        describe("for removing leading new lines", () => {
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
        describe("for removing the trailing lines", () => {
            it("removes the extra lines", () => {
                const answer = "This has a lot of trailing\nnew ----\nlines\n\nas you can see";
                const highlights = [{ beginOffset: 28, endOffset: 31 }];

                const cleaned = focusAnswer({ answer, highlights }, { REMOVE_TRAILING_LINES_WITHOUT_HIGHLIGHTS: true });

                expect(cleaned).to.exist;
                expect(cleaned.answer).to.equal("This has a lot of trailing\nnew ----");
                expect(cleaned.highlights).to.deep.equal(highlights);
            });
            describe("without any highlights", () => {
                it("preserves the answer", () => {
                    const answer = "This has a lot of trailing\nnew ----\nlines\n\nas you can see";
                    const highlights: Highlight[] = [];

                    const cleaned = focusAnswer({ answer, highlights }, { REMOVE_TRAILING_LINES_WITHOUT_HIGHLIGHTS: true });

                    expect(cleaned).to.exist;
                    expect(cleaned.answer).to.equal(answer);
                    expect(cleaned.highlights).to.deep.equal(highlights);
                });
            });
        });
        describe("with both leading and trailing lines", () => {
            it("removes the extra lines", () => {
                const answer = "\n\n\nfoo\nbar\nThis has a lot of trailing\nnew ----\nlines\n\nas you can see";
                const highlights = [
                    { beginOffset: 16, endOffset: 19 }, // **has**
                    { beginOffset: 42, endOffset: 46 }  // **----**
                ];

                const cleaned = focusAnswer({ answer, highlights }, {
                    REMOVE_LEADING_LINES_WITHOUT_HIGHLIGHTS: true,
                    REMOVE_TRAILING_LINES_WITHOUT_HIGHLIGHTS: true
                });

                expect(cleaned).to.exist;
                expect(cleaned.answer).to.equal("\nThis has a lot of trailing\nnew ----");
                expect(cleaned.highlights).to.deep.equal([{ beginOffset: 6, endOffset: 9 }, { beginOffset: 32, endOffset: 36 }]);
                expect(addMarkdownHighlights(cleaned.answer, cleaned.highlights)).to.equal("\nThis **has** a lot of trailing\nnew **----**");
            });
        });
    });
});