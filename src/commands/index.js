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

function extractErrorMessage(validationError) {
  log.info('extractErrorMessage will return: ' + validationError.message);
  return validationError.message;
}

let validateCommand = _.wrapCallback((data, next) => {
  log.info('Will validate new command JSON: ' + util.inspect(data));
  let schema = require('./command-schema.json');
  let isValid = tv4.validate(data, schema);
  if (isValid) { next(null, data); }
  else         { next(new Error(extractErrorMessage(tv4.error)), data); }
});

let validateAggregate = _.wrapCallback((data, next) => {
  if (data.type === 'create') {
    // TODO: Validate aggregate schema for 'create' commands
    log.info('TODO: validate aggregate JSON: ' + util.inspect(data));
    let isValid = true;
    if (!isValid) { next(new Error('not implemented'), data); }
  }
  next(null, data);
});

function applyGuid(data) {
  if (data.type === 'create' && !data.id) {
    data.id = uuidGen.v4();
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

let handleCommands = function() {
  return _.pipeline(
    _.tap(logAs('starting pipeline')),

    _.filter(data => data.type !== undefined),
    _.tap(logAs('after dummy filter')),

    _.flatMap(validateCommand),
    _.tap(logAs('after validateCommand')),

    _.flatMap(validateAggregate),
    _.tap(logAs('after validateAggregate')),

    _.map(applyGuid),
    _.tap(logAs('after applyGuid')),

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
      .pipe(handleCommands())
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
