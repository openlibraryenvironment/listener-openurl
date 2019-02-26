const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../src/Config');
const { OkapiSession } = require('../src/OkapiSession');
const HTTPError = require('../src/HTTPError');

describe('run an Okapi session', () => {
  function rejectConfig(key) {
    it(`rejects a config with no ${key}`, () => {
      let okapi, e;
      try {
        const vars = { loggingCategories: '' };
        vars[key] = '';
        const cfg = new Config(vars);
        okapi = new OkapiSession(cfg);
      } catch (e1) {
        e = e1;
      }
      assert.isDefined(e, 'exception is defined');
      assert.match(e.message, new RegExp(`no ${key} defined`));
      assert.isUndefined(okapi, 'Okapi session is not defined');
    });
  }

  rejectConfig('okapiUrl');
  rejectConfig('tenant');

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

    describe('use a logged-in Okapi session', () => {
      it('posts to a known-bad URL', (done) => {
        okapi.post('/some/silly/path', {}).then((res) => {
          assert.equal(res.status, 404, 'bad path is not found');
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
        console.log('      (skipping)');
        // (For some reason this.skip is not defined, so we can't use that.)
      } else {
        assert.equal(e.name, 'HTTPError', 'correct type of exception');
        assert.match(e.comment, /cannot login/);
        assert.equal(e.response.status, 422);
      }
      done();
    });
  });

  // I'm really only doing this one to get test coverage up
  it('can make HTTPError objects from numeric codes', () => {
    const e = new HTTPError(403, 'no permission to read file');
    assert.equal(e.name, 'HTTPError', 'correct type of exception');
    assert.equal(e.status, 403);
    assert.match(e.comment, /no permission/);
  });
});
