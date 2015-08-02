'use strict';

var hapi = require('hapi');

var server = new hapi.Server();

server.connection({ port: 3000, labels: ['api'] });
server.connection({ port: 3001, labels: ['commands'] });

server.register(require('./commands'), (err) => {
  if (err) {
    throw err;
  }
  server.start();
});

