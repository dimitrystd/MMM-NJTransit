/* A MagicMirror module to show bus, luas and rail arrival times.
 * Copyright (C) 2018 Dmitry Studynskyi
 * License: GNU General Public License */

/* eslint-disable fp/no-mutating-methods,no-undef,guard-for-in,no-restricted-syntax */
// eslint-disable-next-line no-undef
Module.register("MMM-NJTransit", {

    defaults: {
        requiresVersion: "2.4.0",
        animationSpeed: 1000,
        broadcastEvents: true,
        colored: false,
        destinations: [],
        displayDestination: true,
        displayRoute: true,
        displayStopName: true,
        displaySymbol: true,
        fade: true,
        fadePoint: 0.25,
        fetchInterval: 60000,
        maximumEntries: 10,
        maximumNumberOfMinutes: 60,
        routes: [],
        stops: []
    },

    getStyles () {
        return ["default.css", "font-awesome.css"];
    },

    getScripts () {
        return [];
    },

    getTranslations () {
        return false;
    },

    /* initialize */
    start () {
        Log.log(`Starting module: ${this.name}`);

        for (const s in this.config.stops) {
            const stop = this.config.stops[s];

            /* if no individual symbols were defined, set
             * the default ones here based on the stop id */
            if (!stop.symbol) {
                stop.symbol = this.defaultSymbolForStop(stop.id);
            }

            this.addStop(stop);
        }

        this.stopData = {};
        this.loaded = false;
    },

    suspend() {
        this.sendSocketNotification("SUSPEND_NJT_FETCHERS", {});
    },

    resume() {
        this.sendSocketNotification("RESUME_NJT_FETCHERS", {});
    },

    /* handle notifications */
    socketNotificationReceived (notification, payload) {
        if (notification === "NJT_EVENTS") {
            if (this.hasStopId(payload.stopId)) {
                this.stopData[payload.stopId] = payload.events;
                this.loaded = true;

                if (this.config.broadcastEvents) {
                    this.broadcastEvents();
                }
            }
        } else if (notification === "NJT_FETCH_ERROR") {
            Log.error(`NJ Transit Error. Could not fetch stop: ${payload.stopId}`);
        } else {
            Log.log(`NJ Transit received an unknown socket notification: ${notification}`);
        }

        this.updateDom(this.config.animationSpeed);
    },

    /* build the HTML to render */
    getDom () {
        const events = this.createEventList();
        // console.log(events);
        const wrapper = document.createElement("table");
        wrapper.className = "small";

        if (events.length === 0) {
            wrapper.innerHTML = (this.loaded) ? this.translate("EMPTY") : this.translate("LOADING");
            wrapper.className = "small dimmed";
            return wrapper;
        }

        for (const e in events) {
            const event = events[e];
            // console.log(event);
            const eventWrapper = document.createElement("tr");

            if (this.config.colored) {
                eventWrapper.style.cssText = `color:${this.colorForStop(event.stopId)}`;
            }

            eventWrapper.className = "normal";

            /* symbol */
            if (this.config.displaySymbol) {
                const symbolWrapper = document.createElement("td");
                symbolWrapper.className = "symbol align-right";
                const symbol = document.createElement("span");
                symbol.className = `fa fa-fw fa-${this.symbolForStop(event.stopId)}`;
                // console.log(symbol.className);
                symbol.style.paddingLeft = "5px";
                symbolWrapper.appendChild(symbol);
                eventWrapper.appendChild(symbolWrapper);
            }

            /* stop name */
            if (this.config.displayStopName) {
                const stopNameWrapper = document.createElement("td");
                stopNameWrapper.className = this.config.colored ? "stopname" : "stopname bright";
                stopNameWrapper.innerText = this.nameForStop(event.stopId);
                eventWrapper.appendChild(stopNameWrapper);
            }

            /* route */
            if (this.config.displayRoute) {
                const routeWrapper = document.createElement("td");
                routeWrapper.className = this.config.colored ? "route" : "route bright";
                routeWrapper.innerText = event.routeId;
                eventWrapper.appendChild(routeWrapper);
            }

            /* destination */
            if (this.config.displayDestination) {
                const lineWrapper = document.createElement("td");
                lineWrapper.className = this.config.colored ? "destination" : "destination bright";
                lineWrapper.innerText = event.destination;
                eventWrapper.appendChild(lineWrapper);
            }

            const timeWrapper = document.createElement("td");
            timeWrapper.innerText = event.isDue ? "Approaching" : `${event.dueTime} min`;
            timeWrapper.className = "time medium regular bright";
            eventWrapper.appendChild(timeWrapper);

            wrapper.appendChild(eventWrapper);

            /* fade effect */
            if (this.config.fade && this.config.fadePoint < 1) {
                if (this.config.fadePoint < 0) {
                    this.config.fadePoint = 0;
                }
                const startingPoint = events.length * this.config.fadePoint;
                const steps = events.length - startingPoint;
                if (e >= startingPoint) {
                    const currentStep = e - startingPoint;
                    eventWrapper.style.opacity = 1 - (1 / steps * currentStep);
                }
            }
        }

        return wrapper;
    },

    /* Check if this config contains the stop ID.
     *
     * argument stopId string - stop ID to look for.
     *
     * return bool - The config has this stop ID
     */
    hasStopId (stopId) {
        for (const s in this.config.stops) {
            const stop = this.config.stops[s];
            if (stop.id === stopId) {
                return true;
            }
        }

        return false;
    },

    /* Creates the sorted list of all events.
     *
     * return array - Array with events.
     */
    createEventList () {
        const events = [];
        for (const s in this.stopData) {
            const stop = this.stopData[s];
            for (const e in stop) {
                events.push(stop[e]);
            }
        }

        events.sort((a, b) => a.duetime - b.duetime);

        return events.slice(0, this.config.maximumEntries);
    },

    /* Requests node helper to add a stop.
     *
     * argument stopConfig object - Configuration for the stop to add.
     */
    addStop (stopConfig) {
        Log.log(`NJ Transit adding stop id: ${stopConfig.id}`);
        // console.log("addStop() " + stopConfig.id);
        this.sendSocketNotification("ADD_NJT_STOP", {
            stopId: stopConfig.id,
            routes: stopConfig.routes || this.config.routes,
            destinations: stopConfig.destinations || this.config.destinations,
            maximumEntries: stopConfig.maximumEntries || this.config.maximumEntries,
            // eslint-disable-next-line max-len
            maximumNumberOfMinutes: stopConfig.maximumNumberOfMinutes || this.config.maximumNumberOfMinutes,
            fetchInterval: stopConfig.fetchInterval || this.config.fetchInterval
        });
    },

    /* Detects an appropriate default symbol based on the stop ID.
     * - Bus stop IDs are always numerical
     *
     * argument stopId - The stop ID to match a symbol to
     *
     * return string - The symbol for the stop.
     */
    defaultSymbolForStop(stopId) {
        if (stopId.match(/^\d+$/)) {
            return "bus"; // https://fontawesome.com/icons/bus
        }
        return "question-circle"; // https://fontawesome.com/icons/question-circle
    },

    /* Retrieves the symbol for a specific stop ID.
     *
     * argument stopId string - The stop ID to look for.
     *
     * return string - The symbol for the stop.
     */
    symbolForStop (stopId) {
        return this.getStopProperty(stopId, "symbol", this.defaultSymbolForStop(stopId));
    },

    /* Retrieves the name for a specific stop ID.
     *
     * argument stopId string - The stop ID to look for.
     *
     * return string - The custom label if present, or the stop ID.
     */
    nameForStop (stopId) {
        return this.getStopProperty(stopId, "label", stopId);
    },

    /* Retrieves the color for a specific stop ID.
     *
     * argument stopId string - The stop ID to look for.
     *
     * return string - The color for the stop.
     */
    colorForStop (stopId) {
        return this.getStopProperty(stopId, "color", "#fff");
    },

    /* Helper method to retrieve the property for a specific stop.
     *
     * argument stopId string - The stop ID to look for.
     * argument property string - The property to look for.
     * argument defaultValue string - Value if property is not found.
     *
     * return string - The value of the property on the stop.
     */
    getStopProperty (stopId, property, defaultValue) {
        // console.log("getStopProperty()");
        for (const s in this.config.stops) {
            const stop = this.config.stops[s];
            if (stop.id === stopId && stop.hasOwnProperty(property)) {
                return stop[property];
            }
        }
        return defaultValue;
    },


    /* Broadcasts the events to all other modules for reuse.
     * The all events available in one array, sorted on duetime.
     */
    broadcastEvents () {
        const eventList = [];
        for (const stopId in this.stopData) {
            const stop = this.stopData[stopId];
            for (const e in stop) {
                const event = cloneObject(stop[e]);
                event.symbol = this.symbolForStop(stopId);
                event.color = this.colorForStop(stopId);
                eventList.push(event);
            }
        }

        eventList.sort((a, b) => a.duetime - b.duetime);

        this.sendNotification("NJT_EVENTS", eventList);
    }
});
