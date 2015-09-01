 'use strict';

import { log } from './logger';
import tv4 from 'tv4';

/*
 * Validates the supplied json document against the supplied JSON Schema.
 */
export function validateJSON(schema, json) {
  return new Promise((resolve,reject) => {
    setImmediate(() => {
      if (tv4.validate(json, schema)) {
        resolve(json);
      } else {
        reject(new Error(extractErrorMessage(tv4.error)));
      }
    });
  });
}

/*
 * Extracts the 'message' from a supplied validationError.
 */
function extractErrorMessage(validationError) {
  log.info('extractErrorMessage will return: ' + validationError.message);
  return validationError.message;
}
