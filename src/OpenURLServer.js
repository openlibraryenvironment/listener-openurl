// Creates an OpenURL server that contains a configured Koa app.

const Koa = require('koa');
const KoaStatic = require('koa-static');
const { get, omit, find } = require('lodash');
const { ContextObject } = require('./ContextObject');
const { ReshareRequest } = require('./ReshareRequest');
const { OkapiSession } = require('./OkapiSession');
const HTTPError = require('./HTTPError');

class OpenURLServer {
  async handle(cfg, ctx, next) {
    // const cfg = this.cfg;

    if (ctx.path.startsWith('/static/') ||
        ctx.path === '/favicon.ico' ||
        (ctx.path === '/' && ctx.search === '')) {
      await next();
      return;
    }

    cfg.log('flow', 'Enter handle flow');

    const co = new ContextObject(cfg, ctx.query);
    cfg.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery()));

    const metadata = co.getMetadata();
    cfg.log('metadata', JSON.stringify(metadata));

    cfg.log('flow', 'Check service');

    const symbol = get(metadata, ['res', 'org']) || ctx.path.replace(/^\//, '');
    const service = this.services[symbol] || this.services[''];
    if (!service) {
      return new Promise((resolve) => {
        ctx.body = `unsupported service '${symbol}'`;
        resolve();
      });
    }

    const svcCfg = cfg.getValues()?.services?.[symbol] ?? cfg.getValues();
    if (svcCfg.reqIdHeader) {
      let fromHeader = ctx.req.headers?.[svcCfg?.reqIdHeader];
      if (typeof fromHeader === 'string') {
        if (svcCfg.reqIdToUpper) fromHeader = fromHeader.toUpperCase();
        if (svcCfg.reqIdToLower) fromHeader = fromHeader.toLowerCase();
        if (svcCfg.reqIdRegex && svcCfg.reqIdReplacement) {
          fromHeader = fromHeader.replace(RegExp(svcCfg.reqIdRegex), svcCfg.reqIdReplacement);
        }
        cfg.log('flow', `Override requester id with ${fromHeader}`);
        co.setAdmindata('req', 'id', fromHeader);
      }
    }

    const admindata = co.getAdmindata();
    cfg.log('admindata', JSON.stringify(admindata));


    const logout = get(metadata, ['svc', 'logout']);
    if (logout === '1') {
      // Allows us to force a re-login
      service.token = undefined;
    } else if (logout) {
      service.token = 'bad token';
    }

    cfg.log('flow', 'Check metadata');

    const npl = get(metadata, ['svc', 'noPickupLocation']);
    if (!co.hasBasicData() || (!npl && !get(metadata, ['svc', 'pickupLocation']))) {
      return new Promise((resolve) => {
        if (npl) {
          ctx.body = this.form(service, co);
          resolve();
        } else {
          service.getPickupLocations().then(() => {
            ctx.body = this.form(service, co);
            resolve();
          });
        }
      });
    }

    const svcId = get(admindata, ['svc', 'id']);
    if (svcId === 'contextObject') {
      return new Promise((resolve) => {
        ctx.body = { admindata, metadata };
        resolve();
      });
    }

    cfg.log('flow', 'Construct reshare request');
    const rr = new ReshareRequest(co);
    const req = rr.getRequest();
    req.requestingInstitutionSymbol = symbol.includes(':') ? symbol : `RESHARE:${symbol}`;

    cfg.log('rr', JSON.stringify(req));
    if (svcId === 'reshareRequest') {
      return new Promise((resolve) => {
        ctx.body = req;
        resolve();
      });
    }

    cfg.log('flow', 'Post mod-rs request');
    // Provide a way to provoke a failure (for testing): include ctx_FAIL in the OpenURL
    const path = get(admindata, 'ctx.FAIL') ? '/not-there' : '/rs/patronrequests';
    return service.post(path, req)
      .then(res => {
        return res.text()
          .then(body => {
            cfg.log('posted', `sent request, status ${res.status}`);
            if (svcId === 'json') {
              ctx.set('Content-Type', 'text/json');
              ctx.body = {
                status: res.status,
                message: body,
                contextObject: { admindata, metadata },
                reshareRequest: rr.getRequest(),
              };
              return;
            }
            ctx.set('Content-Type', 'text/html');
            if (`${res.status}`[0] !== '2') {
              cfg.log('error', `POST error ${res.status}:`, body);
            }
            try {
              if (npl) {
                ctx.body = this.htmlBody(res, body);
              } else {
                return service.getPickupLocations().then(() => {
                  ctx.body = this.htmlBody(res, body, service.pickupLocations);
                });
              }
            } catch (e) {
              ctx.response.status = 500;
              ctx.body = e.message;
            }
          });
      });
  }

  constructor(cfg) {
    this.cfg = cfg;
    this.services = {};

    const services = cfg.getValues().services || [];
    Object.keys(services).forEach(label => {
      this.services[label] = new OkapiSession(cfg, label, services[label]);
    });

    // Default service
    if (cfg.getValues().okapiUrl) this.services[''] = new OkapiSession(cfg);

    const docRoot = this.cfg.getValues().docRoot;
    if (!docRoot) {
      throw new HTTPError(500, 'no docRoot defined in configuration');
    }

    this.app = new Koa();
    this.app.use((ctx, next) => this.handle(cfg, ctx, next));
    this.app.use(KoaStatic(`${cfg.path}/${docRoot}`));
  }

  initializeOkapiSessions() {
    return Promise.all(
      Object.keys(this.services).map(label => {
        this.services[label].login();
      })
    );
  }

  listen(...args) {
    return this.app.listen(...args);
  }

  htmlBody(res, text, pickupLocations) {
    const status = `${res.status}`;

    const vars = { status };
    try {
      const json = JSON.parse(text);
      vars.json = json;
    } catch (e) {
      vars.text = text;
    };

    if (pickupLocations) {
      const location = find(pickupLocations, x => x.code === vars.json.pickupLocationSlug);
      if (location) vars.pickupLocationName = location.name;
    }

    const ok = (status[0] === '2');
    const template = this.cfg.getTemplate(ok ? 'good' : 'bad');
    return template(vars);
  }

  form(service, co) {
    const query = Object.assign({}, co.getQuery());
    const ntries = query['svc.ntries'] || 0;
    query['svc.ntries'] = ntries + 1;

    let formName;
    const formFields = ['svc.pickupLocation', 'rft.volume', 'svc.note'];
    if (co.hasBasicData()) {
      formName = 'form2';
      formFields.push('svc.neededBy'); // XXX Should this also be in form1?
    } else {
      formName = 'form1';
      formFields.push('rft.title', 'rft.au', 'rft.date', 'rft.pub', 'rft.place', 'rft.edition', 'rft.isbn', 'rft.oclc');
    }

    if (!query['rft.title']) {
      query['rft.title'] = query['rft.btitle'] || query['rft.atitle'] || query['rft.jtitle'];
    }
    if (!query['rft.au']) {
      query['rft.au'] = query['rft.creator'] || query['rft.aulast'] || query['rft.aufirst'];
    }

    const allValues = Object.keys(omit(query, formFields))
      .sort()
      .map(key => `<input type="hidden" name="${key}" value="${query[key]}" />`)
      .join('\n');

    const data = Object.assign({}, query, {
      allValues,
      noPickupLocation: ntries > 0 && !query['svc.pickupLocation'],
      onePickupLocation: (service?.pickupLocations?.length == 1),
      pickupLocations: (service.pickupLocations || []).map(x => ({
        id: x.id,
        code: x.code,
        name: x.name,
        selected: x.id === query['svc.pickupLocation'] ? 'selected' : '',
      })),
    });

    const template = this.cfg.getTemplate(formName);
    return template(data);
  }
}

module.exports = { OpenURLServer };
