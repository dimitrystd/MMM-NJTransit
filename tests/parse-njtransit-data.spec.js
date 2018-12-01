/* A MagicMirror module to show bus, luas and rail arrival times.
 * Copyright (C) 2018 Dmitry Studynskyi
 * License: GNU General Public License */

/* eslint-disable no-unused-expressions */
const { expect } = require("chai");
const fs = require("fs");
const parseXml = require("../classes/parse-njtransit-data");
const { ErrorEventData, BusEventData } = require("../models/event-data");

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
            dueTime: 5,
            isDue: false,
            scheduled: false,
            destination: "new york  via river road"
        });
    });

    it("Bus approaching", async () => {
        const xmlFile = fs.readFileSync("tests/resources/busApproaching.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(BusEventData);
        expect(events[0]).to.deep.equal({
            routeId: "27",
            dueTime: -1,
            isDue: true,
            scheduled: false,
            destination: "b bloomfield  via broad st sta"
        });
    });

    it("Bus with scheduled time", async () => {
        const xmlFile = fs.readFileSync("tests/resources/busWithScheduledTime.xml");
        const events = await parseXml(xmlFile);
        expect(events).to.be.not.empty;
        expect(events[0]).to.be.instanceof(BusEventData);
        expect(events[0]).to.deep.equal({
            routeId: "158",
            dueTime: 5,
            isDue: false,
            scheduled: true,
            destination: "new york  via river road"
        });
    });
});
