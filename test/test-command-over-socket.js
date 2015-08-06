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

describe('CQRS Command Server ',function() {
  it('Should accept a Command and publish corresponding event ', (done) => {
    let client = io.connect(socketURL, options);

    client.on('connect', (data) => {
      client.emit('commands', { name: "aggregate-modification",
                                type: "create",
                                targetName: "aggregate",
                                tenant: "testTenant",
                                body: { text: "new test Item"} } );
    });

    client.on('events', (createdEvent) => {
      createdEvent.should.have.property('id').with.lengthOf(36)
      createdEvent.should.have.property('name', 'aggregate-modification-Executed')
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
