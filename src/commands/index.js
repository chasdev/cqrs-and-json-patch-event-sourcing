'use strict';

let
  _       = require('highland'),
  Bacon   = require('baconjs').Bacon,
  log     = require('../logger').log,
  socket  = require('socket.io'),
  tv4     = require('tv4'),
  util    = require('util'),
  uuidGen = require('node-uuid');


// Helper function to extract a validation error message from
// a validator error.
function extractErrorMessage(validationError) {
  return validationError.message;
}

let validateCommand = _.wrapCallback((data, next) => {
  log.info('Will validate new command JSON: ' + util.inspect(data));
  let schema = require('./command-schema.json');
  let isValid = tv4.validate(data, schema);
  if (isValid) next(null, data);
  else         next(extractErrorMessage(tv4.error), data);
});

let validateAggregate = (data) => {
  if (data.type === 'create') {
    //TODO: Validate the aggregate's JSON against it's schema
    log.info('Will validate new aggregate JSON...');
  }
  return data;
};

let applyGuid = (data) => {
  if (data.type === 'create' && !data.id) {
    data.id = uuidGen.v4();
  }
  if (data.command === 'throwError') {
    throw  new Error("myError");
  }
  return data;
};

let toEvent = (data) => {
  log.info('Will convert command to an event...');
  // TODO: Look up a specific handler for the command type and name
  // As a default, we'll just rename the command so it looks like an event
  data.name = data.name + '-Executed';
  return data;
}

exports.register = (server, options, next) => {

  let io = socket(server.select('commands').listener);
  io.on('connection', (socket) => {
    log.info('New connection from ' + socket.handshake.address);

    socket.on('error', e => io.emit('events', { error: e.message }));

    _('commands', socket)
      .filter(data => data.type !== undefined)
      .flatMap(validateCommand)
      .map(validateAggregate)
      .map(applyGuid)
      .map(toEvent)
      .errors((e, push) => {
        log.info(util.inspect(e));
        push(e);
      })
      //TODO: journal the event within an event store
      .each(data => io.emit('events', data));
  });
  next();
};

exports.register.attributes = {
    name: 'hapi-cqrs-commands'
};
