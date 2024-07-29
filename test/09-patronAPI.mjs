/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import { Config } from '../src/Config.js';
import patronAPIServer from '../src/patronAPIServer.mjs';

const { assert, expect } = chai;
chai.use(chaiHttp);
const mockedRoot = 'http://mocked.local';

nock(mockedRoot)
  .post('/authn/login')
  .reply(201, { someBody: 'text' }, { 'x-okapi-token': 'token' });

nock(mockedRoot)
  .get('/rs/patronrequests?filters=patronIdentifier%3D%3Dbob')
  .reply(200, 'nofilter', { 'content-type': 'text/plain' });

nock(mockedRoot)
  .get('/rs/patronrequests?filters=isRequester%3D%3Dtrue&filters=patronIdentifier%3D%3Dbob')
  .reply(200, { success: 'withfilter' }, { 'content-type': 'application/json' });

nock(mockedRoot)
  .post('/rs/patron/validate', { barcode: '123', pin: '456' })
  .reply(200, { userid: 'bob' }, { 'content-type': 'application/json' });

nock(mockedRoot)
  .post('/rs/patronrequests/123someid/performAction', {
    action: 'requesterCancel',
    actionParams: {
      reason: 'patron_requested',
    },
  })
  .reply(200);

const app = await (patronAPIServer(new Config({
  // loggingCategories: 'error,start,okapi,co,rr,admindata,metadata,flow',
  loggingCategories: '',
  services: {
    'US-EAST': {
      okapiUrl: mockedRoot,
      tenant: 'reshare-east',
      username: 'complete',
      password: 'mockery',
      reqIdToLower: true,
      reqIdRegex: 'abc-(.*)',
      reqIdReplacement: '$1-b',
      reqIdHeader: 'x-remote-user'
    }
  }
})));

describe('09. patron API server', function() {
  const server = app.listen({ port: 0, host: 'localhost' });
  const requester = chai.request(server).keepOpen();

  it('works without additional filter', async function() {
    const res = await requester
      .get('/US-EAST/patronrequests')
      .set('x-remote-user', 'bob');
    expect(res).to.have.status(200);
    expect(res).to.be.text;
    assert.equal(res.text, 'nofilter');
  });

  it('works with additional filter', async function() {
    const res = await requester
      .get('/US-EAST/patronrequests')
      .query({ filters: 'isRequester==true' })
      .set('x-remote-user', 'bob');
    expect(res).to.have.status(200);
    expect(res).to.be.json;
    assert.equal(JSON.parse(res.text).success, 'withfilter');
  });

  it('fails without patron id', async function() {
    const res = await requester
      .get('/US-EAST/patronrequests');
    expect(res).to.have.status(400);
  });

  it('fails with empty patron', async function() {
    const res = await requester
      .get('/US-EAST/patronrequests')
      .set('x-remote-user', '');
    expect(res).to.have.status(400);
  });

  it('fails on unknown service', async function() {
    const res = await requester
      .get('/US-EASE/patronrequests');
    expect(res).to.have.status(404);
  });

  it('fails on unknown route', async function() {
    const res = await requester
      .get('/US-EAST/patronquests');
    expect(res).to.have.status(404);
  });

  it('passes through validation requests', async function() {
    const res = await requester
      .post('/US-EAST/patron/validate')
      .send({ barcode: '123', pin: '456' });
    expect(res).to.have.status(200);
    expect(res).to.be.json;
    assert.equal(JSON.parse(res.text).userid, 'bob');
  });

  it('can cancel a request', async function() {
    const res = await requester
      .post('/US-EAST/patronrequests/123someid/cancel')
      .send({ reason: 'patron_requested' });
    expect(res).to.have.status(200);
  });

  after(function() {
    requester.close();
    server.close();
  });
});
