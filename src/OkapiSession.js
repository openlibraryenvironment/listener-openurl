// Represents an open, authenticated session to an Okapi service.

const fetch = require('node-fetch');
const HTTPError = require('./HTTPError');

class OkapiSession {
  constructor(cfg, label = 'main', values) {
    this.logger = cfg;
    if (!values) values = cfg.getValues();

    const filename = cfg.getFilename();
    ['okapiUrl', 'tenant', 'username', 'password'].forEach(param => {
      const val = values[param];
      if (!val) throw Error(`no ${param} defined for '${label}' in ${filename}`);
      this[param] = val;
    });

    cfg.log('okapi', `making Okapi session '${label}' for ${this.okapiUrl}`);
  }

  login() {
    const { username, password } = this;
    this.logger.log('okapi', `logging into Okapi as ${username}/${password}`);
    return this.post('/authn/login', { username, password })
      .then(res => {
        if (res.status !== 201) throw new HTTPError(res, 'cannot login to FOLIO');
        this.token = res.headers.get('x-okapi-token');
      });
  }

  post(path, payload) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-okapi-tenant': this.tenant,
    };
    if (this.token) headers['x-token-token'] = this.token;
    this.logger.log('okapi', `POST to ${path}`);
    return fetch(`${this.okapiUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers
    });
  }
}


module.exports = { OkapiSession };
