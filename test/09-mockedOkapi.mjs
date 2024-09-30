/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import { Config } from '../src/Config.js';
import { OpenURLServer } from '../src/OpenURLServer.js';

const { assert, expect } = chai;
chai.use(chaiHttp);
const mockedRoot = 'http://mocked.local';

nock(mockedRoot)
  .post('/authn/login')
  .reply(201, { someBody: 'text' }, { 'x-okapi-token': 'token' });

nock(mockedRoot)
  .get('/rs/patronrequests?perPage=1000&filters=state.terminal%3D%3Dfalse&filters=isRequester%3D%3Dtrue&filters=patronIdentifier%3D%3Dsomeone')
  .reply(200, [{ state: { tags: [{ value: 'ACTIVE_PATRON' }] } }, { state: { tags: ['other', { value: 'ACTIVE_PATRON' }] } }], { 'content-type': 'application/json' });

nock(mockedRoot)
  .get('/rs/settings/appSettings?filters=section%3D%3Drequests&filters=key%3D%3Dmax_requests')
  .reply(200, [{ value: '2' }], { 'content-type': 'application/json' });

const app = new OpenURLServer(new Config({
  // loggingCategories: 'error,start,okapi,co,rr,admindata,metadata,flow',
  loggingCategories: '',
  services: {
    'US-EAST': {
      okapiUrl: mockedRoot,
      tenant: 'reshare-east',
      username: 'complete',
      password: 'mockery',
      checkLimit: true
    }
  }
}));

await app.initializeOkapiSessions();

describe('09. mocked Okapi', function() {
  const server = app.listen({ port: 0, host: 'localhost' });
  const requester = chai.request(server).keepOpen();

  it('notices when over limit', async function() {
    const res = await requester
      .get('/US-EAST?rft_id=123&rft.title=Sauroposeidon&rft.au=Wedel&rft.date=1999&req_id=someone');
    expect(res).to.have.status(200);
    assert.include(res.text, 'quest limit');
  });

  after(function() {
    requester.close();
    server.close();
  });
});
