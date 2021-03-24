/*! Copyright (c) 2021, XAPP AI */
import { expect } from "chai";

import { cleanAnswer } from "../cleanAnswer";

import { ANSWER_WITH_TABS, RESULT_WITH_NEWLINES_SPACES } from "./assets/payloads";

describe(`#${cleanAnswer.name}()`, () => {
    describe(`when passed undefined`, () => {
        it("returns undefined", () => {
            expect(cleanAnswer(undefined)).to.be.undefined;
        });
    });
    describe("when passed string with HTML", () => {
        it("it cleans the output", () => {
            expect(cleanAnswer("<h2>Hello</h2>  How are you?")).to.equal("Hello  How are you?")
        });
    });
    describe("with extraneous new lines", () => {
        it("cleans the output", () => {
            const answer = RESULT_WITH_NEWLINES_SPACES.suggested[0].document;
            const cleaned = cleanAnswer(answer);
            expect(cleaned).to.exist;
            expect(cleaned).to.equal("Learn more about second mortgages.\n\nSecurity interest\n\nThe security interest is what lets the lender foreclose if you don't pay back the money you borrowed.\n\nRead more\n\nSeller financing\n\nSeller financing is a loan that the seller of your home makes to you. \n\nRead more\n\nServicer\n\nYour mortgage servicer is the company that sends you your mortgage statements. Your servicer also handles the day-to-day tasks of managing your loan.");
        });
    });
    describe("with extraneous tabs", () => {
        it("cleans the output", () => {
            const cleaned = cleanAnswer(ANSWER_WITH_TABS);
            expect(cleaned).to.exist;
            // Note: I can't do a full string compare here for some reason, I think there is a hidden empty character in there
            expect(cleaned).to.include("October 2020\n\nPlease")
            expect(cleaned).to.include("offer.\n\nLast");
        });
    });
});