'use strict';

import _ from 'highland';
import { log } from '../logger';
import socket from 'socket.io';
import tv4 from 'tv4';
import util from 'util';
import uuidGen from 'node-uuid';


// TODO: use real event store
let journal = _.wrapCallback((data, next) => {
  log.info('Will journal event: ' + util.inspect(data));
  next(null, data);
});

/*
 * Extracts the 'message' from a supplied validationError.
 */
function extractErrorMessage(validationError) {
  log.info('extractErrorMessage will return: ' + validationError.message);
  return validationError.message;
}

//TODO: Refactor - Invoking cb(err) from within setImmediate
//      results in an 'uncaught exception'. Need to determine
//      how to propagate errors from async functions.
/*
 * Validates the command against a JSON Schema.
 */
let validateCommand = _.wrapCallback(function(data, cb) {
  log.info('Will validate new command JSON: ' + util.inspect(data));
  let schema = require('./command-schema.json');
  if (tv4.validate(data, schema)) {
    return setImmediate(() => cb(null, data));
  } else {
    cb(new Error(extractErrorMessage(tv4.error)));
  };
});

let validateAggregateOrPatch = _.wrapCallback((data, cb) => {
  if (data.type === 'create') {
    log.info('TODO: validate aggregate JSON: ' + util.inspect(data.body));
    return setImmediate(() => { cb(null, data) });
  } else {
    // https://github.com/fge/sample-json-schemas/blob/master/json-patch/json-patch.json
    log.info('XXXXXXXXXX validate patch: ' + util.inspect(data.body));
    let schema = require('./json-patch.json');
    if (tv4.validate(data.body, schema)) {
      return setImmediate(() => cb(null, data));
    } else {
      cb(new Error(extractErrorMessage(tv4.error)));
    };
  }
});

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
  return data;
}

function toEvent(data) {
  log.info('Will convert command to an event...');
  // TODO: Look up a specific handler for the command type and name
  // As a default, we'll just rename the command so it looks like an event
  data.name = data.name + '-Executed';
  return data;
}

let logAs = _.curry(function(label, data) {
  log.info(label + ': ' + util.inspect(data));
});

/*
 * Validates the structure of a command, including an included
 * JSON Patch or new aggregate instance against JSON Schema.
 */
function validate() {
  return _.pipeline(
    _.tap(logAs('starting validateCommand pipeline')),

    _.filter(data => data.type !== undefined),
    _.tap(logAs('after dummy filter')),

    _.flatMap(validateCommand),
    _.tap(logAs('after validateCommand')),

    _.flatMap(validateAggregateOrPatch),
    _.tap(logAs('after validateAggregate')),

    _.map(applyGuid),
    _.tap(logAs('after applyGuid')),

    _.map(applyAggregateGuid),
    _.tap(logAs('after applyAggregateGuid')),
  );
};

/*
 * Apply's an event by reconstituting an aggregate (if existing)
 * applying the event, and exercising business rules and
 * or extensions, and lastly journaling the event.
 */
function applyEvent() {
  return _.pipeline(
    _.tap(logAs('starting applyEvent pipeline')),

    _.map(toEvent),
    _.tap(logAs('after toEvent')),

    _.flatMap(journal),
    _.tap(logAs('after journal'))
  );
};

exports.register = (server, options, next) => {

  let io = socket(server.select('commands').listener);
  io.on('connection', (socket) => {
    log.info('New connection from ' + socket.handshake.address);
    socket.on('error', e => io.emit('events', { error: e.message }));
    _('commands', socket)
      .pipe(validate())
      .pipe(applyEvent())
      .errors((e, push) => {
        log.info('Error handler will push error to socket: ' + util.inspect(e));
        push(e);
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
