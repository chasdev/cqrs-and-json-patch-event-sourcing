# CQRS and JSON Patch Event Sourcing

Status: VERY incomplete. My primary goal is experimentation with Highland.js and ES2015/ES2016 features.

This README contains forward looking statements -- there is not much implemented here yet.
See 'Current Status' section at bottom of this README.

## TL;DR

This project uses the Command Query Responsibility Segregation (CQRS) pattern to accept commands over a web socket. These commands are handled, and are subsequently converted into events and written to an event store (using the 'Event Sourcing' (ES) architectural pattern).

While most CQRS and ES implementations employ explicit Aggregate objects to hold state, execute commands and emit events, this implementation applies various functions (transforms) to the commands and events within a pipeline.  That is,

* aggregate state is held as either a JSON document representing the initial state of an aggregate or as a JSON Patch representing a change to an existing aggregate. These JSON documents are carried within the commands and events progressing through a pipeline.
* aggregate business logic (for handling commands) is provided by externalized business rules and extensions which are applied to the commands in the pipeline.

It is a best practice when using CQRS and ES to create specific domain (business) commands and events. However, this implementation also allows use of a generic command/event for changing the state of an aggregate. That is, while 'business events' (and commands) are important, simple 'edits' may not warrant modeling as an explicit business event.

Consequently, a generic command/event may be used to create an aggregate, to patch an existing aggregate, or to indicate the aggregate should be considered to be deleted. Specifically, the generic command/event will either contain an aggregate's initial state (as a JSON document) or a JSON Patch (affecting an existing aggregate).

This service validates commands against a [JSON Schema](https://github.com/chasdev/cqrs-and-json-patch-event-sourcing/blob/evt-store/src/commands/command-schema.json). (See attribution at end of README.)

This service currently uses the open source [Event Store](https://geteventstore.com) to journal events.  An easy way to run Event Store is via the [wkruse/eventstore-docker](git@github.com:wkruse/eventstore-docker.git) Docker container. To run the tests without having an Event Store, you may set '``NODE_ENV=test``' (which will use a simple mock).

_(planned:)_ In addition to the web socket interface, this service exposes a typical resource-oriented HTTP/S API supporting CRUD of resources. POST, PATCH, PUT, and DELETE requests are converted into appropriate 'aggregate-modification' commands that result in events that are written to the event journal. As such, the HTTP/S API is a front-end to the CQRS/ES implementation supporting modification of aggregates. GET requests are supported by accessing the 'read' database.

_(planned:)_ This endpoint is generic and must be injected with JSON Schemas (if validation of payloads is enabled), custom command handlers (to support custom business commands beyond 'create', 'patch', and 'delete' commands), business rules (that are invoked when processing a command and that are specified using the [nools]() DSL), and state machines (that may be used to support long-running processes). Without injecting these custom artifacts, this service supports basic CRUD of aggregates using JSON without validation. These custom artifacts are retrieved from GitHub based on configuration specified in environment variables, however the retrieval of these artifacts may be performed at build time and 'baked' into a Docker container to support production deployments using immutable containers.

_(planned:)_ To support the 'query' side of CQRS, a '[MemoryImage](http://martinfowler.com/bliki/MemoryImage.html)' will be used. This will still require interaction with the Event Store to ensure the 'version' of an aggregate contained within the memory image reflects the last journaled event for that aggregate. (The memory image may be a very simple weakmap.) In addition, or as an alternative, various projections supported by the Event Store may be employed when handling queries.

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

_(planned: This will likely be dockerized as well.)_

## API

_This section has not yet been written._

## Design Overview

_This section has not yet been written._

## Attribution

* JSON Patch JSON Schema source:  https://github.com/fge/sample-json-schemas/blob/master/json-patch/json-patch.json

## Current Status

* Currently appends an event to EventStore but does not require a version to be supplied (i.e., does not optimistic lock). If a version is supplied it will be checked. (This is just for convenience temporarily, to preclude the need to determine the current version (location) within a stream before a test can journal a new event.)
* Does not reconstitute the aggregate to apply the event and execute business rules etc. -- it just appends events to the journal regardless of whether they make sense... This makes this completely unsuitable for anything real. If you look at the code, the 'commandProcessingPipeline' is currently a no-op pipeline.
* No HTTP/S API implemented yet. The HTTP API is intended to accept 'command' requests (that uses the same processing as if the command was received over a web socket), and to handle 'query' (GET) requests (by querying a 'current state store' held in memory).
* No current state store, or mechansim to replay events to determine the current state. Nor is there support for snapshots or projections.  There is very little functionality implemented; this project is currently serving mainly as a learning experiment for highland.js and ES2016 features.
* Very limited tests. Again, this is (currently?) a toy project.
