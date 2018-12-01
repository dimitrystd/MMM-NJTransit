/* A MagicMirror module to show bus, luas and rail arrival times.
 * Copyright (C) 2018 Dmitry Studynskyi
 * License: GNU General Public License */

const xml2js = require("xml2js");
const util = require("util");
const { ErrorEventData, BusEventData } = require("../models/event-data");

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
    const isDue = preObj.pu === "approaching";
    const dueTime = isDue ? -1 : parseInt(preObj.pt, 10);
    if (!preObj.rn) {
        return [new ErrorEventData("XML has no \"rn\" tag (route number)")];
    }
    const destination = preObj.fd ? preObj.fd.replace(preObj.rn, "").trim() : "";
    return new BusEventData(preObj.rn, dueTime, isDue, preObj.scheduled === "true", destination);
}

const parseNjtData = async (xml) => {
    const parser = new xml2js.Parser({
        trim: true,
        explicitArray: false,
        ignoreAttrs: true,
        normalizeTags: true,
        valueProcessors: [name => name.toLowerCase()]
    });
    try {
        const xmlObj = await util.promisify(parser.parseString.bind(parser))(xml);
        // console.info(xmlObj);
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
            for (let i = 0; i < xmlObj.stop.pre.length; i += 1) {
                events.push(parseBusData(xmlObj.stop.pre[i]));
            }
        } else {
            events.push(parseBusData(xmlObj.stop.pre));
        }
        return events;
    } catch (e) {
        return [new ErrorEventData(`Could not parse XML from string "${xml}"`)];
    }
};

module.exports = parseNjtData;
