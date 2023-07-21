const { describe, it, after } = require('mocha');
const chai = require('chai');
const assert = chai.assert;
const chaiHttp = require('chai-http');
const { Config } = require('../src/Config');
const { OpenURLServer } = require('../src/OpenURLServer');

chai.use(chaiHttp);
const app = (new OpenURLServer(new Config({ XloggingCategories: '' })));

const tests = [
  {
    path: '/static/test/thing-that-is-not-there',
    status: 404,
  },
  {
    path: '/static/test/plain.txt',
    status: 200,
    contentType: 'text/plain; charset=utf-8',
    match: /plain text/,
  },
  {
    path: '/static/test/formatted.html',
    status: 200,
    contentType: 'text/html; charset=utf-8',
    match: /earliest known/,
  },
  {
    path: '/static/test/upper.HTML',
    status: 200,
    contentType: 'text/html; charset=utf-8',
    match: /also/,
  },
  {
    path: '/static/test/xenoposeidon.jpeg',
    status: 200,
    contentType: 'image/jpeg',
  },
  {
    path: '/static/../favicon.ico',
    // I would rather this naughty path was rejected with a 403, but oh well
    status: 200,
    contentType: 'image/vnd.microsoft.icon',
  },
  {
    path: '/static/../../openurl.json',
    status: 403, // Rejected as trying to escape the docRoot
  },
  {
    path: '/favicon.ico',
    status: 200,
    contentType: 'image/vnd.microsoft.icon',
  },
];

describe('08. retrieve static files from server', () => {
  const server = app.listen({ port: 0, host: 'localhost' });
  const requester = chai.request(server).keepOpen();

  tests.forEach(test => {
    it(`gets expected result for path '${test.path}'`, async () => {
      const res = await requester.get(test.path);
      assert.equal(res.status, test.status);
      if (test.status === 200) {
        assert.equal(res.headers['content-type'], test.contentType);
        if (test.match) {
          assert.match(res.text, test.match);
        }
      }
    });
  });

  after(() => {
    requester.close();
    server.close();
  });
});
