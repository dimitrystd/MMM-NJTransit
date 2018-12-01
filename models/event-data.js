/* A MagicMirror module to show bus, luas and rail arrival times.
 * Copyright (C) 2018 Dmitry Studynskyi
 * License: GNU General Public License */

class EventData {
}

class ErrorEventData extends EventData {
    constructor(errorMsg) {
        super();
        this.errorMsg = errorMsg;
    }
}

class BusEventData extends EventData {
    constructor(routeId, dueTime, isDue, scheduled, destination) {
        super();
        this.routeId = routeId;
        this.dueTime = dueTime;
        this.isDue = isDue;
        this.scheduled = scheduled;
        this.destination = destination;
    }
}

module.exports = {
    ErrorEventData,
    BusEventData
};
