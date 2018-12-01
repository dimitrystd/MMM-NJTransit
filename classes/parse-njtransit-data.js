const xml2js = require("xml2js");
const util = require("util");
const { ErrorEventData, BusEventData } = require("../models/evant-data");

function parseBusData(preObj) {
    if (!preObj.rn) {
        return [new ErrorEventData("XML has no \"rn\" tag (route number)")];
    }
    if (!preObj.scheduled) {
        return [new ErrorEventData("XML has no \"scheduled\" tag (is it scheduled or actual time)")];
    }
    if (!preObj.pt && !preObj.pu) {
        return [new ErrorEventData("XML has no \"pr\" or \"pu\" tag (time)")];
    }
    let dueTime;
    if (preObj.pu === "approaching") {
        dueTime = "Approaching";
    } else {
        dueTime = `${preObj.pt} ${preObj.pu}`;
    }
    return new BusEventData(preObj.rn, dueTime, preObj.scheduled === "true");
}

async function parseNjtData(xml) {
    const parser = new xml2js.Parser({
        trim: true,
        explicitArray: false,
        ignoreAttrs: true,
        normalizeTags: true,
        valueProcessors: [name => name.toLowerCase()]
    });
    try {
        const xmlObj = await util.promisify(parser.parseString.bind(parser))(xml);
        if (!xmlObj.stop) {
            return [new ErrorEventData("XML has no \"stop\" tag")];
        }
        if (xmlObj.stop.noPredictionMessage) {
            return [new ErrorEventData(xmlObj.stop.noPredictionMessage)];
        }
        if (!xmlObj.stop.pre) {
            return [new ErrorEventData("XML has no \"pre\" tag")];
        }
        /* eslint-disable fp/no-mutating-methods */
        const events = [];
        if (xmlObj.stop.pre instanceof Array) {
            for (let i = 0; i < xmlObj.stop.pre.length; i++) {
                events.push(parseBusData(xmlObj.stop.pre[i]));
            }
        } else {
            events.push(parseBusData(xmlObj.stop.pre));
        }
        // console.info(xmlObj);
        return events;
    } catch (e) {
        return [new ErrorEventData(`Could not parse XML from string "${xml}"`)];
    }
}

module.exports = parseNjtData;
