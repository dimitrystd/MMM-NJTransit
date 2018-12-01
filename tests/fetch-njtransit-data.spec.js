const { expect } = require("chai");
const NjtFetcher = require("../classes/fetch-njtransit-data");

describe("Test fetcher", () => {
    beforeEach(() => {
        this.fetcher = new NjtFetcher(123, 10, 158, "dir", "dest", 10, 60);
    });

    it("Non xml file", () => {
       this.fetcher.fetchStop();
    });
    it("Non xml file", () => {
        // this.fetcher.exclude(null);
    });
});
