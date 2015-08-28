# Event Sourcing

Status: VERY incomplete. Initial goal is just experimentation, to play with Highland.js

* Currently appends an event to EventStore but does not require a version to be supplied (i.e., does not  optimistic lock). If a version is supplied it will be checked.
* Does not reconstitute the aggregate to apply the event and execute business rules etc. -- it just appends events to the journal regardless of whether they make sense... This current omission makes this completely unsuitable for anything real.
* No HTTP/S API implemented yet
* Very limited tests

## TL;DR

NOTICE: This README contains forward looking statements -- see above status; there is not much implemented yet.

A generic web socket endpoint used for issuing commands (the Command Query Responsibility Segregation (CQRS) pattern) that are converted into events and written to an event store (the 'event sourcing' (ES) architectural pattern). While CQRS and ES encourage the creation of domain (business) events, this implementation also supports a generic command/event for basic CRUD. That is, a generic command/event may be used to create or patch an aggregate or to indicate the aggregate should be considered to be deleted. The generic command/event will either contain the aggregate as a JSON document (if new) or a JSON Patch (if existing). Event Sourcing uses, as the source of truth, an event store to journal events affecting an aggregate instead of updating an aggregate's current state within a persistent store.

This service validates commands against a [JSON Schema](https://github.com/chasdev/cqrs-and-json-patch-event-sourcing/blob/evt-store/src/commands/command-schema.json).

This service currently uses the open source [Event Store](https://geteventstore.com) to journal events. JSON Patch is used as a standard mechanism for affecting changes to aggregates (i.e., JSON Patch is used within the events being journaled). An easy way to run Event Store is via the [wkruse/eventstore-docker](git@github.com:wkruse/eventstore-docker.git) Docker container. To run the tests without having an Event Store, you may set '``NODE_ENV=test``' (which will use a simple mock).

In addition to the web socket interface, this service exposes a typical resource-oriented HTTP/S API supporting CRUD of resources. POST, PATCH, PUT, and DELETE requests are converted into appropriate 'aggregate-modification' commands that result in events that are written to the event journal. As such, the HTTP/S API is a front-end to the CQRS/ES implementation supporting modification of aggregates. GET requests are supported by accessing the 'read' database.

This endpoint is generic and must be injected with JSON Schemas (if validation of payloads is enabled), custom command handlers (to support custom business commands beyond 'create', 'patch', and 'delete' commands), business rules (that are invoked when processing a command and that are specified using the [nools]() DSL), and state machines (that may be used to support long-running processes). Without injecting these custom artifacts, this service supports basic CRUD of aggregates using JSON without validation.

These custom artifacts are retrieved from GitHub based on configuration specified in environment variables, however the retrieval of these artifacts may be performed at build time and 'baked' into a Docker container to support production deployments using immutable containers.

CQRS may also leverage various projections employed to optimize various types of queries, although this service itself maintains only a single projection (the 'read' database 'current state store').

## Running the service

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

## API

### Web Socket Interface

The web socket interface may be used to issue commands that comply with the `cqrs-schema/command.json` JSON Schema.

(TODO: Complete!)
#

## Attribution

* JSON Patch JSON Schema source:  https://github.com/fge/sample-json-schemas/blob/master/json-patch/json-patch.json

