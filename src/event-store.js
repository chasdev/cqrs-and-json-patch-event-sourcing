 'use strict';

import dotenv from 'dotenv';
import ges from 'ges-client';
import { log } from './logger';

dotenv.load();

let esHost = process.env.EVENT_STORE_HOST;
let esPort = process.env.EVENT_STORE_PORT;

let connection = ges({ host: esHost, port: esPort });
connection.on('connect', function() {
  log.info('Connected to EventStore...')
});

let revision = 0;
function mockES(event) {
  return new Promise((resolve,reject) => {
    setImmediate(function() {
      event.expectedVersion = revision++;
      resolve(event);
    });
  });
}

function es(event) {
  return new Promise((resolve,reject) => {
    let evt = ges.createEventData(event.id, event.targetName, true,
                                  new Buffer(event), null );
    evt.expectedVersion = ges.expectedVersion.any;
    connection.appendToStream(event.targetName, evt, (err, result) => {
      log.info('XXXXXX callback err = ' + require('util').inspect(err));
      log.info('XXXXXX callback evt = ' + require('util').inspect(result));
      if (err) reject(err);
      resolve(event);
    });
  });
}

export async function appendEvent(event) {
  try {
    // let result = await mockES(event);
    let result = await es(event);
    log.info('event-store.appendEvent appended event ' + require('util').inspect(result));
    return result;
  } catch (e) {
    // TODO: Perform retries before giving up...
    log.error('appendToStream failed with: ' + e.message);
  }
}
