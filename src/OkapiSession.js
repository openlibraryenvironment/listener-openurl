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

  async _getDataFromReShare(path, caption) {
    const res = await this.okapiFetch('GET', path);
    if (res.status !== 200) throw new HTTPError(res, `cannot fetch default ${caption} for '${this.label}'`);
    const json = await res.json();
    this.logger.log('json', this.label, JSON.stringify(json, null, 2));
    return json;
  }

  async getPickupLocations() {
    const path = '/directory/entry?filters=tags.value%3Di%3Dpickup&filters=status.value%3Di%3Dmanaged&perPage=100&stats=true';
    const json = await this._getDataFromReShare(path, 'pickup locations');
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
  }

  async getCopyrightTypes() {
    const path = '/rs/refdata?filters=desc%3D%3DcopyrightType&sort=desc%3Basc&max=100';
    const json = await this._getDataFromReShare(path, 'copyright types');
    this.copyrightTypes = json[0].values
      .map(r => ({ id: r.id, code: r.value, name: r.label }));
  }

  async getDefaultCopyrightType() {
    const path = '/rs/settings/appSettings?filters=section%3D%3Dother&filters=key%3D%3Ddefault_copyright_type&perPage=1';
    const json = await this._getDataFromReShare(path, 'default copyright type');
    this.defaultCopyrightType = json[0].id;
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
