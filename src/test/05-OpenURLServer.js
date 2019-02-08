const { describe, it, after } = require('mocha');
const chai = require('chai');
const assert = chai.assert;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const { Config } = require('../Config');
const { OpenURLServer } = require('../OpenURLServer');

const app = (new OpenURLServer(new Config())).getApp();

describe('send OpenURLs to server', () => {
  const server = app.listen({ port: 0, host: 'localhost' });
  const requester = chai.request(server).keepOpen();

  it('Handles an OpenURL with just item ID', async() => {
    const res = await requester.get(`/?rft_id=123`);
    assert.equal(res.status, 200);
    assert.equal(res.text, 'OpenURL request received\n');
  });

  after(() => {
    requester.close();
    server.close();
  });
});
