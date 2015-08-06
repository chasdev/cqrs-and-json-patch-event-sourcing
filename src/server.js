'use strict';

import commandHandler from './commands';
import hapi from 'hapi';
import { log } from './logger';
import { promisify } from 'bluebird';

export default async function startServer() {
  try {
    const server = new hapi.Server();

    ['register', 'start'].forEach( method => {
      server[method] = promisify(server[method], server);
    });

    server.connection({ port: 3000, labels: ['api'] });
    server.connection({ port: 3001, labels: ['commands'] });

    await server.register(commandHandler);

    await server.start();
    log.info('started server');

    console.log('Server started at ' + server.info.uri);
  } catch(e) {
    console.log(e);
  }
}
