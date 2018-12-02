/* A MagicMirror module to show bus, luas and rail arrival times.
 * Copyright (C) 2018 Dmitry Studynskyi
 * License: GNU General Public License */

/* eslint-disable guard-for-in,no-restricted-syntax,no-console */
// eslint-disable-next-line import/no-unresolved
const nodeHelper = require("node_helper");
const NjtFetcher = require("./classes/fetch-njtransit-data");

module.exports = nodeHelper.create({

    start() {
        this.fetchers = [];
        console.log(`Starting node helper for: ${this.name}`);
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "ADD_NJT_STOP") {
            // console.log(payload);
            this.createFetcher(payload.stopId,
                payload.fetchInterval,
                payload.routes,
                payload.destinations,
                payload.maximumEntries,
                payload.maximumNumberOfMinutes);
        } else if (notification === "SUSPEND_NJT_FETCHERS") {
            for (const stopId in this.fetchers) {
                const fetcher = this.fetchers[stopId];
                console.log(`Suspending fetching stopId=${stopId}`);
                fetcher.stopFetch();
            }
        } else if (notification === "RESUME_NJT_FETCHERS") {
            for (const stopId in this.fetchers) {
                const fetcher = this.fetchers[stopId];
                console.log(`Resuming fetching stopId=${stopId}`);
                fetcher.startFetch();
            }
        }
    },

    /* Creates a fetcher for a new stopId if it doesn't exist yet.
     * Otherwise it reuses the existing one.
     *
     * attribute stopId int - id of the stop.
     * attribute fetchInterval number - Interval for getting new data for this stop.
     * attribute routes - the routes to filter for at this stop.
     * attribute maximumEntries - the max number of events to fetch for this stop.
     * attribute maximumNumberOfMinutes - the max due time for events to show for this stop.
     */
    createFetcher(stopId, fetchInterval, routes, destinations,
        maximumEntries, maximumNumberOfMinutes) {
        const self = this;

        let njtFetcher;
        if (typeof self.fetchers[stopId] === "undefined") {
            console.log(`Create new NJT fetcher for stopId: ${stopId} - Interval: ${fetchInterval}`);
            njtFetcher = new NjtFetcher(stopId, fetchInterval, routes,
                destinations, maximumEntries, maximumNumberOfMinutes);

            njtFetcher.onReceive((fetcher) => {
                // console.log('Fetcher onReceive()');
                // console.log(fetcher.events());

                self.sendSocketNotification("NJT_EVENTS", {
                    stopId: fetcher.stopId,
                    events: fetcher.events
                });
            });

            njtFetcher.onError((fetcher, error) => {
                self.sendSocketNotification("NJT_FETCH_ERROR", {
                    stopId: fetcher.stopId,
                    error
                });
            });

            self.fetchers[stopId] = njtFetcher;
        } else {
            // console.log('Use existing fetcher for stopId: ' + stopId);
            njtFetcher = self.fetchers[stopId];
            njtFetcher.broadcastEvents();
        }

        njtFetcher.startFetch();
    }
});
