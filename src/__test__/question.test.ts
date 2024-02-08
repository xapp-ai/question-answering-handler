/*! Copyright (c) 2024, XAPP AI */
import { expect } from "chai";

import { isQuestion } from "../question";

describe(`#${isQuestion.name}()`, () => {
    it("returns the expected result", () => {
        expect(isQuestion("not a question")).to.be.false;
        expect(isQuestion("who is Michael")).to.be.true;
        expect(isQuestion("is this a question?")).to.be.true;
        expect(isQuestion("What services do you provide")).to.be.true;
        expect(isQuestion("What services do you provide?")).to.be.true;
    });
});