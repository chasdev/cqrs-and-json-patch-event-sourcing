# CQRS and JSON Patch Event Sourcing (experimentation only)

Status: VERY INCOMPLETE and MAY NOT BE COMPLETED.
My primary goal was to play a little with Highland.js and ES2015/ES2016 features, and I may not have much if any time to work on this.

## TL;DR

Accepts a command over a web socket, converts it into an event, and writes it to an event store.

Instead of using an Aggregate object to hold state, execute commands, and emit events, various functions (transforms) are used to interact with the commands and events carried as json in highland.js streams. TODO: Currently, while events are created and journaled into an event store, the affected aggregate is not reconstituted nor are business rules exercised to 'apply' the event. This is obviously a huge functional gap with respect to CQRS and ES, so this project is not (yet?) very useful.

It is considered best practice when using CQRS and ES to create specific domain (business) commands and events. While 'business events' (and commands) are indeed very important, simple 'edits' may imho not warrant modeling as an explicit business event. Consequently, a generic command/event will be able to create an aggregate, patch an existing aggregate, or indicate an aggregate should be (considered to be) deleted. Specifically, a generic command/event will either contain a JSON document representing the aggregate's initial state or a JSON Patch affecting existing state.

Commands are validated using a [JSON Schema](https://github.com/chasdev/cqrs-and-json-patch-event-sourcing/blob/evt-store/src/commands/command-schema.json).

The open source [Event Store](https://geteventstore.com) is used to journal events.  An easy way to run Event Store is via the [wkruse/eventstore-docker](git@github.com:wkruse/eventstore-docker.git) Docker container. To run the tests without having an Event Store, you may set '``NODE_ENV=test``' (which will use a simple mock).

There is very little functionality implemented thus far. For example, aggregates are not reconstituted, business logic is not exercised, etc...

----

## Installing and Running the service

1 - Install dependencies normally:

```
$ npm install
```

2 - Ensure the environment variables identified below are set. This can be achieved by including a ``.env`` file (not checked into git) containing the following:

```
# Host/port of EventStore - download from https://geteventstore.com or use the
# git@github.com:wkruse/eventstore-docker.git Docker container
EVENT_STORE_HOST={the_host}
EVENT_STORE_PORT={the_port}
```

3 - Run the service:

```
$ npm start
```

or the unit tests:

```
$ npm test
```

The log level may be set by preceding the start and test commands as follows:

```
$ LOG_LEVEL=trace npm start
```

```
$ LOG_LEVEL=fatal npm test
```

## Attribution

* JSON Patch JSON Schema was copied from:  https://github.com/fge/sample-json-schemas/blob/master/json-patch/json-patch.json

## Current Status

* Currently appends an event to EventStore but does not require a version to be supplied (i.e., does not optimistic lock). If a version is supplied it will be checked. (This is just for convenience temporarily, to preclude the need to determine the current version (location) within a stream before a test can journal a new event.)
* Does not reconstitute the aggregate to apply the event and execute business rules etc. -- it just appends events to the journal regardless of whether they make sense... This makes this completely unsuitable for anything real. If you look at the code, the 'commandProcessingPipeline' is currently a no-op pipeline.
* No HTTP/S API implemented yet. The HTTP API is intended to accept 'command' requests (that uses the same processing as if the command was received over a web socket), and to handle 'query' (GET) requests (by querying a 'current state store' held in memory).
* No current state store, or mechansim to replay events to determine the current state. Nor is there support for snapshots or projections.  There is very little functionality implemented; this project is currently serving mainly as a learning experiment for highland.js and ES2016 features.
* Very limited tests. Again, this is (currently?) a toy project.
