'use strict';

import bunyan from 'bunyan';
import pkgJson from '../package';

export let log = bunyan.createLogger({
  name: pkgJson.name,
  stream: process.stdout,
  level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'trace'
});
