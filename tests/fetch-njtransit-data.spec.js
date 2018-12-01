/* A MagicMirror module to show bus, luas and rail arrival times.
 * Copyright (C) 2018 Dmitry Studynskyi
 * License: GNU General Public License */

const { expect } = require("chai");
const sinon = require("sinon");
const NjtFetcher = require("../classes/fetch-njtransit-data");
const njtParser = require("../classes/parse-njtransit-data");

describe("Test fetcher", () => {
    before(() => {
        this.clock = sinon.useFakeTimers();
    });

    after(() => {
        this.clock.restore();
    });

    beforeEach(() => {
        this.fetcher = new NjtFetcher(123, 10, 158, "dir", "dest", 10, 60);
    });

    it("Non xml file", async () => {
        // sinon.stub(njtParser, "parseNjtData")
        //     .callsFake(() => "mock");
        njtParser = sinon.stub();
        await this.fetcher.fetchStop();
    });
    it("Non xml file", () => {
        // this.fetcher.exclude(null);
    });
});
