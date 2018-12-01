class EventData {
    // stopId;

    // constructor(stopId) {
    //     this.stopId = stopId;
    // }
}

class ErrorEventData extends EventData {
    // errorMsg;

    constructor(errorMsg) {
        super();
        this.errorMsg = errorMsg;
    }
}

class BusEventData extends EventData {
    // errorMsg;

    constructor(routeId, due, scheduled) {
        super();
        this.routeId = routeId;
        this.due = due;
        this.scheduled = scheduled;
    }
}

module.exports = {
    ErrorEventData,
    BusEventData
};
