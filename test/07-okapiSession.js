const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../src/Config');
const { OkapiSession } = require('../src/OkapiSession');

describe('run an Okapi session', () => {
  it('correctly fails to authenticate with bad credentials', (done) => {
    const cfg = new Config({ loggingCategories: '', password: 'somethingWrong' });
    const okapi = new OkapiSession(cfg);
    const p = okapi.login();
    p.then(() => {
      done(new Error('logged in successfully but did not expect to'));
    }, (e) => {
      assert.equal(e.name, 'HttpError', 'correct type of exception');
      assert.match(e.comment, /cannot login/);
      assert.equal(e.response.status, 422);
      done();
    });
  });
});
