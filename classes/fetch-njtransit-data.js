/* A MagicMirror module to show bus, luas and rail arrival times.
* Copyright (C) 2018 Dmitry Studynskyi
* License: GNU General Public License */

/* eslint-disable guard-for-in,no-restricted-syntax,no-console */
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const request = require("request-promise-native");
const njtParser = require("./parse-njtransit-data");
const { ErrorEventData } = require("../models/event-data");

class NjtFetcher {
    constructor(stopId, fetchInterval, routes, destinations,
        maximumEntries, maximumNumberOfMinutes) {
        this.reloadTimer = null;
        this.events = [];

        this.fetchFailedCallback = () => {
        };
        this.eventsReceivedCallback = () => {
        };

        this.stopId = stopId;
        this.fetchInterval = fetchInterval;
        this.routes = routes;
        this.destinations = destinations;
        this.maximumEntries = maximumEntries;
        this.maximumNumberOfMinutes = maximumNumberOfMinutes;
    }

    /* exclude if the duetime is beyond the configured limit.
     * never exclude if no max was configured. */
    excludeDueTime(event) {
        if (!this.maximumNumberOfMinutes) {
            return false;
        }
        return event.dueTime > this.maximumNumberOfMinutes;
    }

    /* Filters out events based on the user config */
    exclude(event) {
        return this.excludeDueTime(event) || this.excludeRoute(event)
            || this.excludeDestination(event);
    }

    /* exclude a route unless it matches exactly a value configured.
     * using substrings to match routes could result in false positives.
     * some routes are substrings of others, i.e. '42' and '42x'
     * never exclude if no routes were configured. */
    excludeRoute(event) {
        if (!this.routes || !this.routes.length) {
            return false;
        }
        const routeId = event.routeId.toLowerCase();
        for (const r in this.routes) {
            const desiredRoute = this.routes[r].toLowerCase();
            if (desiredRoute && routeId === desiredRoute) {
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

    /* schedule the timer for the next update */
    scheduleTimer() {
        // console.log('Schedule update timer.');
        clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(() => this.fetchStop(), this.fetchInterval);
    }

    /* trigger fetching a stop */
    startFetch() {
        this.fetchStop();
    }

    /* stop time and calling fetchStop() */
    stopFetch() {
        clearTimeout(this.reloadTimer);
        this.reloadTimer = null;
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

    /* fetches the data from NJ Transit API */
    async fetchStop() {
        this.stopFetch();

        const apiUrl = `http://mybusnow.njtransit.com/bustime/eta/getStopPredictionsETA.jsp?route=all&stop=${this.stopId}`;
        await request(apiUrl)
            .then(async (body) => {
                const newEvents = [];

                const parsedEvents = await njtParser(body);
                for (let i = 0; i < parsedEvents.length; i++) {
                    parsedEvents[i].stopId = this.stopId;

                    if (parsedEvents[i] instanceof ErrorEventData) {
                        this.fetchFailedCallback(this, parsedEvents[i].errorMsg);
                        this.scheduleTimer();
                        return;
                    }

                    if (this.exclude(parsedEvents[i])) {
                        // console.log("excluded event:");
                        // console.log(event);
                    } else {
                        /* eslint-disable fp/no-mutating-methods */
                        newEvents.push(parsedEvents[i]);
                        // console.log(e);
                    }
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
            }).catch((err) => {
                /* handle HTTP errors */
                console.error(`NJ Transit error querying NJ Transit API for stop id: ${this.stopId}`);
                console.error(err);
                this.fetchFailedCallback(this, err);
                this.scheduleTimer();
            });
    }
}

module.exports = NjtFetcher;
