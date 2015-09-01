 'use strict';

import dotenv from 'dotenv';
import ges from 'ges-client';
import { log } from './logger';
import util from 'util';

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
      log.info('MOCK event store will journal event...')
      event.version = revision++;
      resolve(event);
    });
  });
}

function es(event) {
  return new Promise((resolve,reject) => {
    let appendData = {};
    appendData.events = ges.createEventData(event.id, event.targetName, true,
                                            JSON.stringify(event), null );
    appendData.expectedVersion = event.version
                               ? event.version
                               : ges.expectedVersion.any;
    connection.appendToStream(event.targetName, appendData, (err, result) => {
      if (err) reject(err);
      event.version = result.NextExpectedVersion;
      resolve(event);
    });
  });
}

function useES() {
  return process.env.NODE_ENV !== 'test';
}

export async function appendEvent(event) {
  try {
    let result = useES()
               ? await es(event)
               : await mockES(event);
    log.info('event-store.appendEvent appended event ' + util.inspect(result));
    return result;
  } catch (e) {
    // TODO: Perform retries before giving up...
    log.error('appendToStream failed with: ' + e.message);
  }
}
