const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../../src/Config');
const { OkapiSession } = require('../../src/OkapiSession');

describe('run an Okapi session', () => {
  it('correctly authenticates with good credentials', (done) => {
    const cfg = new Config({ loggingCategories: '', filename: 'config/caliban.json' });
    const okapi = new OkapiSession(cfg);
    const p = okapi.login();
    p.then(() => {
      assert.match(okapi.token, /^[a-zA-Z0-9_.-]*$/);
      done();
    });

    describe('use a logged-in Okapi session', () => {
      it('posts to a known-bad URL', (done) => {
        okapi.post('/some/silly/path', {}).then((res) => {
          assert.equal(res.status, 404, 'bad path is not found');
          done();
        });
      });
    });
  });
});
