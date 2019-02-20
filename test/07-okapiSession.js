const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../src/Config');
const { OkapiSession } = require('../src/OkapiSession');

describe('run an Okapi session', () => {
  it('correctly authenticates with good credentials', (done) => {
    const cfg = new Config({ loggingCategories: '' });
    const okapi = new OkapiSession(cfg);
    const p = okapi.login();
    p.then(() => {
      assert.match(okapi.token, /^[a-zA-Z0-9_.-]*$/);
      done();
    }, (e) => {
      if (e.name === 'FetchError') {
        // No Okapi running: skip this test
        console.log('      (skipping)');
        done();
      } else {
        done(e);
      }
    });
  });

  it('correctly fails to authenticate with bad credentials', (done) => {
    const cfg = new Config({ loggingCategories: '', password: 'somethingWrong' });
    const okapi = new OkapiSession(cfg);
    const p = okapi.login();
    p.then(() => {
      done(new Error('logged in successfully but did not expect to'));
    }, (e) => {
      if (e.name === 'FetchError') {
        // No Okapi running: skip this test
        console.log('(skipping)');
        // (For some reason this.skip is not defined, so we can't use that.)
      } else {
        assert.equal(e.name, 'HttpError', 'correct type of exception');
        assert.match(e.comment, /cannot login/);
        assert.equal(e.response.status, 422);
      }
      done();
    });
  });
});
