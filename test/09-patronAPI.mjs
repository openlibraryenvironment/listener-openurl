import chai from 'chai';
import chaiHttp from 'chai-http';
import { MockAgent, setGlobalDispatcher, } from 'undici';
import { Config } from '../src/Config.js';
import patronAPIServer from '../src/patronAPIServer.mjs';

const { assert, expect } = chai;
chai.use(chaiHttp);

const mockAgent = new MockAgent();
mockAgent.disableNetConnect();
setGlobalDispatcher(mockAgent);
const mockPool = mockAgent.get('http://mocked.local');
mockPool.intercept({
  path: '/authn/login',
  method: 'POST',
}).reply(201, { someBody: 'text' }, {
  headers: { 'x-okapi-token': 'token' }
});

mockPool.intercept({
  path: '/rs/patronrequests?filters=patronIdentifier%3D%3Dbob',
  method: 'GET',
}).reply(200, 'nofilter', {
  headers: { 'content-type': 'text/plain' }
});

mockPool.intercept({
  path: '/rs/patronrequests?filters=isRequester%3D%3Dtrue&filters=patronIdentifier%3D%3Dbob',
  method: 'GET',
}).reply(200, { success: 'withfilter' }, {
  headers: { 'content-type': 'application/json' }
});
// }).reply(200, 'nofilter', {
//   headers: { 'content-type': 'text/plain' }
// });

const app = await (patronAPIServer(new Config({
  loggingCategories: 'error,start,okapi,co,rr,admindata,metadata,flow',
  // loggingCategories: '',
  services: {
    'US-EAST': {
      okapiUrl: 'http://mocked.local',
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

describe('09. patron API server', () => {
  const server = app.listen({ port: 0, host: 'localhost' });
  const requester = chai.request(server).keepOpen();

  it('works without additional filter', async () => {
    const res = await requester
      .get('/US-EAST/patronrequests')
      .set('x-remote-user', 'bob');
    expect(res).to.have.status(200);
    expect(res).to.be.text;
    assert.equal(res.text, 'nofilter');
  });

  it('works with additional filter', async () => {
    const res = await requester
      .get('/US-EAST/patronrequests')
      .query({ filters: 'isRequester==true' })
      .set('x-remote-user', 'bob');
    expect(res).to.have.status(200);
    expect(res).to.be.json;
    assert.equal(JSON.parse(res.text).success, 'withfilter');
  });

  it('fails without patron id', async () => {
    const res = await requester
      .get('/US-EAST/patronrequests');
    expect(res).to.have.status(400);
  });

  it('fails with empty patron', async () => {
    const res = await requester
      .get('/US-EAST/patronrequests')
      .set('x-remote-user', '');
    expect(res).to.have.status(400);
  })

  it('fails on unknown service', async () => {
    const res = await requester
      .get('/US-EASE/patronrequests');
    expect(res).to.have.status(404);
  });

  it('fails on unknown route', async () => {
    const res = await requester
      .get('/US-EAST/patronquests');
    expect(res).to.have.status(404);
  });

  after(() => {
    requester.close();
    server.close();
  });
});
