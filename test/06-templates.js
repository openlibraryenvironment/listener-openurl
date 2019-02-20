const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../src/Config');

const cfg = new Config();

const tests = [
  {
    name: 'good',
    values: { status: 201 },
    checks: [
      /All is well/,
      /status = 201/,
    ]
  },
  {
    name: 'bad',
    values: { status: 500, otherVal: 965 },
    checks: [
      /Something went wrong/,
      /status = 500/,
      /otherVal.*: 965/,
    ]
  },
  {
    name: 'madeUpName',
    fail: true,
  }
];

describe('substitute into templates', () => {
  it('correctly fails on a non-existent config', () => {
    let undefinedCfg;
    try {
      undefinedCfg = new Config({ filename: 'no/such/file' });
    } catch (e) {
      assert.match(e.message, /no such file/);
    }
    assert.isUndefined(undefinedCfg, 'no config was created');
  });

  tests.forEach((test, i) => {
    it(`correctly ${test.fail ? 'fails to substitute' : 'substitutes'} in template '${test.name}'`, () => {
      let template;
      try {
        template = cfg.getTemplate(test.name);
      } catch (e) {
        assert.isTrue(test.fail, `expected exception ${e}`);
        assert.match(e.message, /no template/);
      }

      if (template) {
        const text = template(test.values);
        test.checks.forEach(re => {
          assert.match(text, re, `matches regular expression ${re}`);
        });
      }
    });
  });
});
