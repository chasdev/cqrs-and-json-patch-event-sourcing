 'use strict';

const
  io = require('socket.io-client'),
  options = {
    transports: ['websocket'],
    'force new connection': true
  },
  socketURL = 'http://127.0.0.1:3001',
  util      = require('util');

require('../index');
require('should');

let client; // this is set within begin blocks

/* eslint-disable quotes */

describe('CQRS Command Server ',function() {

  it('Should accept a \'create\' command and publish event ', (done) => {
    let client = io.connect(socketURL, options);

    client.on('connect', (data) => {
      client.emit('commands', { name: "aggregate-modification",
                                type: "create",
                                targetName: "foos",
                                tenant: "testTenant",
                                // TODO: Read from stream to determine version
                                //       and require it to be provided.
                                // version: 13,
                                body: { text: "new test Item"} } );
    });

    client.on('events', (createdEvent) => {
      createdEvent.should.have.property('id').with.lengthOf(36)
      createdEvent.should.have.property('targetId').with.lengthOf(36)
      createdEvent.should.have.property('name', 'aggregate-modification-Executed')
      /* Disconnect so we don't interfere with the next test */
      client.disconnect();
        done();
    });
  });

  it('Should accept a \'patch\' command and publish event ', (done) => {
    let client = io.connect(socketURL, options);

    client.on('connect', (data) => {
      client.emit('commands', { name: "aggregate-modification",
                                type: "patch",
                                targetName: "foos",
                                targetId: "00000000-e95e-4dc9-8e78-5db108a26637",
                                tenant: "testTenant",
                                body: [ { "op": "replace",
                                          "path": "/text",
                                          "value": "patched" } ] } );
    });

    client.on('events', (patchedEvent) => {
      patchedEvent.should.have.property('id').with.lengthOf(36)
      patchedEvent.should.have.property('name', 'aggregate-modification-Executed')
      /* Disconnect so we don't interfere with the next test */
      client.disconnect();
      done();
    });
  });

  it('Should report an error on the event channel to communicate errors ', (done) => {
    let client = io.connect(socketURL, options);

    client.on('connect', (data) => {
      client.emit('commands', { name: "aggregate-modification",
                                type: "create",
                                tenant: "testTenant",
                                body: { text: "new test Item"} } );
    });

    client.on('events', (expectedError) => {
      expectedError.should.have.property('error', 'Missing required property: targetName');
      /* Disconnect so we don't interfere with the next test */
      client.disconnect();
      done();
    });
  });
});
