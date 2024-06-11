/*! Copyright (c) 2024, XAPP AI */
import { expect } from "chai";

import { isQuestion, popLastQuestion, lastSentenceIsQuestion } from "../question";

describe(`#${isQuestion.name}()`, () => {
    it("returns the expected result", () => {
        expect(isQuestion("not a question")).to.be.false;
        expect(isQuestion("who is Michael")).to.be.true;
        expect(isQuestion("is this a question?")).to.be.true;
        expect(isQuestion("What services do you provide")).to.be.true;
        expect(isQuestion("What services do you provide?")).to.be.true;
    });
});

describe(`#${popLastQuestion.name}()`, () => {
    it("should return an array with the text without the last question and the last question", () => {
        const text = "How are you? What is your name?";
        const expectedText = "How are you?";
        const expectedQuestion = "What is your name?";
        const [resultText, resultQuestion] = popLastQuestion(text);
        expect(resultText).to.equal(expectedText);
        expect(resultQuestion).to.equal(expectedQuestion);
    });

    it("should return an array with the original text and an empty string if there are no questions", () => {
        const text = "Hello, Michael!";
        const expectedText = "Hello, Michael!";
        const expectedQuestion = "";
        const [resultText, resultQuestion] = popLastQuestion(text);
        expect(resultText).to.equal(expectedText);
        expect(resultQuestion).to.equal(expectedQuestion);
    });

    // this doesn't work
    xdescribe("when first sentence has markdown", () => {
        it("should return an array with the text without the last question and the last question", () => {
            const text = "**This is the answer you are looking for.**  What is your name?";
            const expectedText = "**This is the answer you are looking for.**";
            const expectedQuestion = "What is your name?";
            const [resultText, resultQuestion] = popLastQuestion(text);
            expect(resultText).to.equal(expectedText);
            expect(resultQuestion).to.equal(expectedQuestion);
        });
    });
});

describe(`#${lastSentenceIsQuestion.name}()`, () => {
    it("returns true if the last sentence is a question", () => {
        const questionText = "How are you?";
        const nonQuestionText = "This is not a question.";
        const longSentenceWithQuestionAtEnd = "This is a long sentence. This is another sentence. How are you?";
        expect(lastSentenceIsQuestion(questionText)).to.be.true;
        expect(lastSentenceIsQuestion(nonQuestionText)).to.be.false;
        expect(lastSentenceIsQuestion(longSentenceWithQuestionAtEnd)).to.be.true;
    });
});