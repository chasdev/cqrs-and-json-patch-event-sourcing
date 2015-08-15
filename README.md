# Event Sourcing

Status:  Placeholder. Not much here yet. Simply using this to play with Highland.js etc.

## TL;DR

NOTICE: This README contains forward looking statements -- see above Status!

A generic web socket endpoint used for issuing commands ala the Command Query Responsibility Segregation (CQRS) pattern that converts commands into events for subsequent persistence into an event store (ala the 'event sourcing' architectural pattern). To persist aggregates, this service uses a generic command/event to contain the aggregate (if new) or a patch to the aggregate (if existing). Event Sourcing uses, as the source of truth, an event store to journal events affecting an aggregate instead of updating an aggregate's current state within a persistent store.

This service uses the postgres database as an event store. JSON Patch is used as a standard mechanism for affecting changes to aggregates (i.e., JSON Patch is used within the events being journaled). In addition to the event store, a 'read' database is also updated to facilitate retrieval of the current aggregate state.

In addition to the web socket interface, this service exposes a typical resource-oriented HTTP/S API supporting CRUD of resources. POST, PATCH, PUT, and DELETE requests are converted into appropriate 'aggregate-modification' commands that result in events that are written to the event journal. As such, the HTTP/S API is a front-end to the CQRS/ES implementation supporting modification of aggregates. GET requests are supported by accessing the 'read' database.

This endpoint is generic and must be injected with JSON Schemas (if validation of payloads is enabled), custom command handlers (to support custom business commands beyond 'create', 'patch', and 'delete' commands), business rules (that are invoked when processing a command and that are specified using the [nools]() DSL), and state machines (that may be used to support long-running processes). Without injecting these custom artifacts, this service supports basic CRUD of aggregates using JSON without validation.

These custom artifacts are retrieved from GitHub based on configuration specified in environment variables, however the retrieval of these artifacts may be performed at build time and 'baked' into a Docker container to support production deployments using immutable containers.

CQRS may also leverage various projections employed to optimize various types of queries, although this service itself maintains only a single projection (the 'read' database 'current state store').

## Running the service

Install dependencies normally:

```
$ npm install
```

and then either run the service:

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

