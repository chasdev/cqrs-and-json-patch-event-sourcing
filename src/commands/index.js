 'use strict';

import _ from 'highland';
import { appendEvent } from '../event-store';
import { log } from '../logger';
import socket from 'socket.io';
import util from 'util';
import uuidGen from 'node-uuid';
import { validateJSON } from '../validator';

let io; // socket

let validateCommand = _.wrapCallback((data, cb) => {
  (async function() {
    try {
      let schema = require('./command-schema.json');
      let result = await validateJSON(schema, data);
      log.info(' ' + util.inspect(result));
      return cb(null, result);
    } catch (e) {
      log.error('validateCommand failed with: ' + e.message);
      return cb(e);
    }
  })();
});

let validateAggregateOrPatch = _.wrapCallback((data, cb) => {
  (async function() {
    try {
      if (data.type === 'create') {
        //TODO: Retrieve aggregate schema to allow validation
        log.warn('validation of aggregate JSON not implemented!');
        return setImmediate(() => { cb(null, data) });
      } else {
        let schema = require('./json-patch.json');
        let result = await validateJSON(schema, data.body);
        return cb(null, data);
      }
    } catch (e) {
      log.error('validateAggregateOrPatch failed with: ' + e.message);
      return cb(e);
    }
  })();
});

let journal = _.wrapCallback((data, cb) => {
  (async function() {
    try {
       log.info('journal() is going to appendEvent...')
       let result = await appendEvent(data);
       log.info('journal() appended event')
       cb(null, result);
    } catch (e) {
      log.error('journal() caught: ' + e.message);
      cb(e);
    }
  })();
});

let logAs = _.curry(function(label, data) {
  log.info(label + ': ' + util.inspect(data));
});

exports.register = (server, options, next) => {

  io = socket(server.select('commands').listener);

  io.on('connection', (socket) => {
    log.info('New connection from ' + socket.handshake.address);

    socket.on('error', e => io.emit('events', { error: e.message }));

    _('commands', socket)
      .pipe(commandValidationPipeline())
      .pipe(commandProcessingPipeline())
      .pipe(eventJournalingPipeline())
      .errors((e, push) => {
        log.error('Error encountered in stream: ' + util.inspect(e));
        push(e); // TODO: cleanse error before pushing
      })
      .each(data => {
        log.info('Going to emit ' + util.inspect(data));
        io.emit('events', data);
      });
  });
  next();
};

exports.register.attributes = {
    name: 'hapi-cqrs-commands'
};

/*
 * Validates the structure of a command, including an included
 * JSON Patch or new aggregate instance against JSON Schema.
 */
function commandValidationPipeline() {
  return _.pipeline(
    _.tap(logAs('starting command validation pipeline')),

    _.filter(data => data.type !== undefined),
    _.tap(logAs('after data.type filter')),

    _.flatMap(validateCommand),
    _.tap(logAs('after validateCommand')),
    _.errors((e, push) => { reportError(e) }),

    _.flatMap(validateAggregateOrPatch),
    _.tap(logAs('after validateAggregateOrPatch')),
    _.errors((e, push) => { reportError(e) }),

    _.map(applyGuid),
    _.tap(logAs('after applyGuid')),

    _.map(applyAggregateGuid),
    _.tap(logAs('after applyAggregateGuid')),
  );
}

/*
 * Processes a command by reconstituting an aggregate (if existing)
 * and exercising associated business rules and extensions.
 */
function commandProcessingPipeline() {
  return _.pipeline(
    _.tap(logAs('starting command processing pipeline')),

    // _.map(executeCommandOnAggregate),
    _.tap(logAs('after executeCommandOnAggregate')),
    _.errors((e, push) => { reportError(e) }),
  );
}

/*
 * Converts a command into an event, and writes that event
 * into the event journal.
 */
function eventJournalingPipeline() {
  return _.pipeline(
    _.tap(logAs('starting event journaling pipeline')),

    _.map(toEvent),
    _.tap(logAs('after toEvent')),

    _.flatMap(journal),
    _.tap(logAs('after journal'))
  );
}

function reportError(e) {
  io.emit('events', {'error': e.message });
}

function applyGuid(data) {
  if (!data.id) data.id = uuidGen.v4();
  return data;
}

function applyAggregateGuid(data) {
  if (data.type !== 'create') return data;
  if (!data.targetId) {
    if (data.body && data.body.id) {
      data.targetId = data.body.id;
    } else {
      data.targetId = uuidGen.v4();
      data.body.id = data.targetId;
    }
  }
  return data
}

function toEvent(data) {
  log.info('Will convert command to an event...');
  // TODO: Look up a specific handler for the command type and name
  // As a default, we'll just rename the command so it looks like an event
  data.name = data.name + '-Executed';
  return data;
}
