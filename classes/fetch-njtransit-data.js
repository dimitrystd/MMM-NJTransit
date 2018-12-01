/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const request = require("request");
const njtParser = require("./parse-njtransit-data");
const { ErrorEventData, BusEventData } = require("../models/evant-data");

class NjtFetcher {
    constructor(stopId, fetchInterval, routes, directions, destinations,
        maximumEntries, maximumNumberOfMinutes) {
        this.reloadTimer = null;
        this.events = [];

        this.fetchFailedCallback = () => { };
        this.eventsReceivedCallback = () => { };

        this.stopId = stopId;
        this.fetchInterval = fetchInterval;
        this.routes = routes;
        this.directions = directions;
        this.destinations = destinations;
        this.maximumEntries = maximumEntries;
        this.maximumNumberOfMinutes = maximumNumberOfMinutes;
    }

    /* Returns the stopId of this fetcher.
     *
     * return string - The stopId of this fetcher.
     */
    // get stopId() {
    //     return this.stopId;
    // }

    /* exclude if the duetime is beyond the configured limit.
     * never exclude if no max was configured. */
    excludeDueTime(event) {
        if (!this.maximumNumberOfMinutes) {
            return false;
        }
        return event.duetime > this.maximumNumberOfMinutes;
    }

    /* Filters out events based on the user config */
    exclude(event) {
        return this.excludeDueTime(event) || this.excludeRoute(event)
            || this.excludeDirection(event) || this.excludeDestination(event);
    }

    /* exclude a route unless it matches exactly a value configured.
     * using substrings to match routes could result in false positives.
     * some routes are substrings of others, i.e. '42' and '42x'
     * never exclude if no routes were configured. */
    excludeRoute(event) {
        if (!this.routes || !this.routes.length) {
            return false;
        }
        const route = event.route.toLowerCase();
        for (const r in this.routes) {
            const desiredRoute = this.routes[r].toLowerCase();
            if (desiredRoute && route === desiredRoute) {
                // console.log("include route: " + route);
                return false;
            }
        }
        return true;
    }

    /* exclude a destination unless it contains a value configured.
     * never exclude if no destinations were configured. */
    excludeDestination(event) {
        if (!this.destinations || !this.destinations.length) {
            return false;
        }
        const destination = event.destination.toLowerCase();
        for (const d in this.destinations) {
            const desiredDestination = this.destinations[d].toLowerCase();
            if (desiredDestination && destination.indexOf(desiredDestination) >= 0) {
                // console.log("include destination: " + destination);
                return false;
            }
        }
        return true;
    }

    /* exclude a direction unless it contains a value configured.
     * never exclude if no directions were configured. */
    excludeDirection(event) {
        if (!this.directions || !this.directions.length) {
            return false;
        }
        const direction = event.direction.toLowerCase();
        for (let i = 0; i < this.directions; i++) {
            const desiredDirection = this.directions[i].toLowerCase();
            if (desiredDirection && direction.indexOf(desiredDirection) >= 0) {
                // console.log("include direction: " + direction);
                return false;
            }
        }
        return true;
    }

    /* schedule the timer for the next update */
    scheduleTimer() {
        // console.log('Schedule update timer.');
        clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(() => this.fetchStop(), this.fetchInterval * 1000);
    }

    /* PUBLIC METHODS */

    /* trigger fetching a stop */
    startFetch() {
        this.fetchStop();
    }

    /* Broadcast the existing events */
    broadcastEvents() {
        // console.log('Broadcasting ' + events.length + ' events.');
        // console.log(events);
        this.eventsReceivedCallback(this);
    }

    /* Sets the on success callback
     *
     * argument callback function - The on success callback.
     */
    onReceive(callback) {
        this.eventsReceivedCallback = callback;
    }

    /* Sets the on error callback
     *
     * argument callback function - The on error callback.
     */
    onError(callback) {
        this.fetchFailedCallback = callback;
    }


    /* Returns current available events for this fetcher.
     *
     * return array - The current available events for this fetcher.
     */
    // events() {
    //     return this.events;
    // }

    /* fetches the data from RTPI API */
    fetchStop() {
        clearTimeout(this.reloadTimer);
        this.reloadTimer = null;

        const apiUrl = `http://mybusnow.njtransit.com/bustime/eta/getStopPredictionsETA.jsp?route=all&stop=${this.stopId}`;
        request(apiUrl, async (err, response, body) => {
            const newEvents = [];

            /* handle HTTP errors */
            if (err) {
                console.error(`DublinRTPI error querying RTPI API for stop id: ${this.stopId}`);
                console.error(err);
                this.fetchFailedCallback(this, err);
                this.scheduleTimer();
                return;
            }

            const parsedEvents = await njtParser(body);
            for (let i = 0; i < parsedEvents.length; i++) {
                parsedEvents[i].stopId = this.stopid;

                if (parsedEvents[i] instanceof ErrorEventData) {
                    this.fetchFailedCallback(this, parsedEvents[i].errorMsg);
                    this.scheduleTimer();
                    return;
                }

                if (this.exclude(parsedEvents[i])) {
                    // console.log("excluded event:");
                    // console.log(event);
                    continue;
                }
                /* eslint-disable fp/no-mutating-methods */
                newEvents.push(parsedEvents[i]);
                // console.log(e);
            }

            /* eslint-disable fp/no-mutating-methods */
            /* sort by duetime */
            newEvents.sort((a, b) => a.duetime - b.duetime);

            /* limit number of events */
            this.events = newEvents.slice(0, this.maximumEntries);
            // console.log(newEvents);

            /* notify */
            this.broadcastEvents();
            this.scheduleTimer();
        });
    }
}

module.exports = NjtFetcher;
