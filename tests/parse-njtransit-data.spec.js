/* eslint-disable no-unused-expressions */
const { expect } = require("chai");
const fs = require("fs");
const parseXml = require("../classes/parse-njtransit-data");
const { ErrorEventData, BusEventData } = require("../models/evant-data");

describe("Test parser - fail cases", () => {
    it("Non xml file", async () => {
        const events = await parseXml("Hello");
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(ErrorEventData);
    });

    it("Another xml file", async () => {
        const events = await parseXml("<root>Hello</root>");
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(ErrorEventData);
    });

    it("Unexpected xml structure", async () => {
        const xmlFile = fs.readFileSync("tests/resources/invalidXmlStructure.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(ErrorEventData);
    });

    it("No service schedule", async () => {
        const xmlFile = fs.readFileSync("tests/resources/noServiceScheduled.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(ErrorEventData);
    });
});

describe("Test parser - success cases", () => {
    it("One bus schedule in file", async () => {
        const xmlFile = fs.readFileSync("tests/resources/oneBus.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events).to.have.length(1);
        expect(events[0]).to.be.instanceof(BusEventData);
    });

    it("Multiple buses schedule in file", async () => {
        const xmlFile = fs.readFileSync("tests/resources/multipleBuses.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events).to.have.length(3);
        events.forEach((val, i, arr) => expect(val).to.all.instanceof(BusEventData));
    });

    it("Bus will arrive in 5min", async () => {
        const xmlFile = fs.readFileSync("tests/resources/busWillArriveIn5min.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(BusEventData);
        expect(events[0]).to.deep.equal({
            routeId: "158",
            due: "5 minutes",
            scheduled: false
        });
    });

    it("Bus approaching", async () => {
        const xmlFile = fs.readFileSync("tests/resources/busApproaching.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(BusEventData);
        expect(events[0]).to.deep.equal({
            routeId: "27",
            due: "Approaching",
            scheduled: false
        });
    });

    it("Bus with scheduled time", async () => {
        const xmlFile = fs.readFileSync("tests/resources/busWithScheduledTime.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(BusEventData);
        expect(events[0]).to.deep.equal({
            routeId: "158",
            due: "5 minutes",
            scheduled: true
        });
    });
});
