const fs = require('fs');
const { describe, it } = require('mocha');
const { assert } = require('chai');
const { Config } = require('../src/Config');

const cfg = new Config();

const tests = [
  {
    name: 'good',
    values: { status: 201 },
    checks: [
      /Request sent/,
    ]
  },
  {
    name: 'bad',
    values: { status: 500, otherVal: 965 },
    checks: [
      /Something is wrong/,
      /status is 500/,
      /otherVal.*: 965/,
    ]
  },
  {
    // Re-use template in part to get code coverage of caching
    name: 'bad',
    values: { status: 500, couldBeAnything: 'herring' },
    checks: [
      /Something is wrong/,
      /status is 500/,
      /couldBeAnything.*herring/,
    ]
  },
  {
    name: 'madeUpName',
    fail: true,
  },
  {
    name: 'good',
    values: {
      json: {
        title: 'Surprised by Joy',
        author: 'C. S. Lewis',
        publicationDate: 1955,
        isbn: '1518737161',
      },
      pickupLocationName: 'Front desk',
    },
    equalToFile: 'good.html'
  },
  {
    name: 'bad',
    values: { json: {} },
    equalToFile: 'bad.html'
  },
  {
    name: 'form1',
    values: { json: {} },
    equalToFile: 'form1.html'
  },
  {
    name: 'form2',
    values: { json: {} },
    equalToFile: 'form2.html'
  }
];

describe('06. substitute into templates', () => {
  it('correctly fails on a non-existent config', () => {
    let undefinedCfg;
    try {
      undefinedCfg = new Config({ filename: 'no/such/file' });
    } catch (e) {
      assert.match(e.message, /no such file/);
    }
    assert.isUndefined(undefinedCfg, 'no config was created');
  });

  it('correctly loads a vacuous config from the current directory', () => {
    const vacuousCfg = new Config({ filename: 'package.json' });
    // For extra credit: is it wrong to peek inside the Config structure in the next line?
    assert.equal(vacuousCfg.path, '.', 'config path is current directory');
  });


  tests.forEach((test, i) => {
    it(`correctly ${test.fail ? 'fails to substitute' : 'substitutes'} in template '${test.name}'`, () => {
      let text;
      try {
        text = cfg.runTemplate(test.name, test.values);
      } catch (e) {
        assert.isTrue(test.fail, `expected exception ${e}`);
        assert.match(e.message, /no template/);
      }

      if (test.checks) {
        test.checks.forEach(re => {
          assert.match(text, re, `matches regular expression ${re}`);
        });
      }
      if (test.equalToFile) {
        const expected = fs.readFileSync(`test/substituted/${test.equalToFile}`, 'utf8');
        assert.equal(text, expected, 'templated text as expected');
      }
    });
  });
});
