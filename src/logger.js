'use strict';

let
  bunyan = require('bunyan');

module.exports.log = bunyan.createLogger({
  name: 'cqrs-and-json-patch-event-sourcing',
  stream: process.stdout,
  level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
});
