// Represents an open, authenticated session to an Okapi service.

const fetch = require('node-fetch');
const HTTPError = require('./HTTPError');

class OkapiSession {
  constructor(cfg, label = 'main', values) {
    this.logger = cfg;
    this.label = label;
    if (!values) values = cfg.getValues();
    if (values.withoutOkapi) return;

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
    this.logger.log('okapi', `logging into Okapi session '${this.label}' as ${username}/${password}`);
    this.token = undefined;
    return this.okapiFetch('POST', '/authn/login', { username, password }, true)
      .then(res => {
        if (res.status !== 201) throw new HTTPError(res, `cannot login to FOLIO session '${this.label}'`);
        this.token = res.headers.get('x-okapi-token');
      });
  }

  getPickupLocations() {
    const method = 'GET';
    const path = '/directory/entry?filters=tags.value%3Di%3Dpickup&filters=status.value%3Di%3Dmanaged&perPage=100&stats=true';
    return this.okapiFetch(method, path, undefined)
      .then(res => {
        if (res.status !== 200) throw new HTTPError(res, `cannot fetch pickup locations for '${this.label}'`);
        return res.json().then((json) => {
          this.logger.log('json', this.label, json);
          this.pickupLocations = json.results
            .map(r => ({ id: r.id, code: r.slug, name: r.name }))
            .sort((a, b) => {
              if (typeof a.name !== 'string') {
                if (typeof b.name !== 'string') return 0;
                return 1;
              }
              if (typeof b.name !== 'string') return -1;
              return a.name.localeCompare(b.name);
            });
        });
      });
  }

  post(path, payload) {
    return this.okapiFetch('POST', path, payload);
  }

  okapiFetch(method, path, payload, doNotRetry) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-okapi-tenant': this.tenant,
    };
    if (this.token) headers['x-okapi-token'] = this.token;
    this.logger.log('okapi', `okapiFetch ${method} for session '${this.label}' at ${path}`);
    return fetch(`${this.okapiUrl}${path}`, {
      method,
      body: payload ? JSON.stringify(payload) : undefined,
      headers
    }).then(res => (
      ((res.status === 401 || res.status === 403) && !doNotRetry)
        ? this.login().then(res => this.okapiFetch(method, path, payload, true))
        : res)
    );
  }
}


module.exports = { OkapiSession };
