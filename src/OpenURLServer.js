// Creates an OpenURL server that contains a configured Koa app.
const compose = require('koa-compose');
const Koa = require('koa');
const KoaStatic = require('koa-static');
const { get, omit, find } = require('lodash');
const { ContextObject } = require('./ContextObject');
const { ReshareRequest } = require('./ReshareRequest');
const { OkapiSession } = require('./OkapiSession');
const idTransform = require('./idTransform');


async function parseRequest(ctx, next) {
  ctx.cfg.log('flow', 'Parse request');

  const co = new ContextObject(ctx.cfg, ctx.query);
  ctx.cfg.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery()));

  const metadata = co.getMetadata();
  ctx.cfg.log('metadata', JSON.stringify(metadata));

  ctx.cfg.log('flow', 'Check service');
  // service can come from path OR parameter
  const symbol = get(metadata, ['res', 'org']) || ctx.path.replace(/^\//, '');
  const service = ctx.services[symbol] || ctx.services[''];
  if (!service) ctx.throw(404, `unsupported service '${symbol}'`);

  const svcCfg = ctx.cfg.getServiceValues(symbol);
  if (svcCfg.reqIdHeader) {
    let fromHeader = ctx.req.headers?.[svcCfg?.reqIdHeader];
    if (typeof fromHeader === 'string') {
      fromHeader = idTransform(fromHeader, svcCfg);
      ctx.cfg.log('flow', `Override requester id with ${fromHeader}`);
      co.setAdmindata('req', 'id', fromHeader);
    }
  }

  const admindata = co.getAdmindata();
  ctx.cfg.log('admindata', JSON.stringify(admindata));

  const logout = get(metadata, ['svc', 'logout']);
  if (logout === '1') {
    // Allows us to force a re-login
    service.token = undefined;
  } else if (logout) {
    service.token = 'bad token';
  }

  const npl = svcCfg.digitalOnly || get(metadata, ['svc', 'noPickupLocation']);

  Object.assign(ctx.state, { admindata, co, metadata, npl, service, svcCfg, symbol });
  await next();
}


// Used to protect against keys that are included multiple times
function unArray(val) {
  while (Array.isArray(val)) val = val[0];
  return val;
}


function makeFormData(ctx, query, service, valuesNotShownInForm, firstTry) {
  const currentCopyrightType = query['rft.copyrightType'] || service.defaultCopyrightType;
  query.svc_id ||= 'loan';

  const data = Object.assign({}, query, {
    valuesNotShownInForm,
    digitalOnly: ctx.state?.svcCfg?.digitalOnly,

    noPickupLocation: !firstTry && !query['svc.pickupLocation'] && !ctx.state?.svcCfg?.digitalOnly,
    noGenre: !firstTry && !query['rft.genre'] && query.svc_id === 'copy',
    noTitle: !firstTry && !query['rft.title'] && query.svc_id === 'loan',
    noAuthor: !firstTry && !query['rft.au'] && query.svc_id === 'loan',
    noChapterTitle: !firstTry && !query['rft.titleOfComponent'] && query.svc_id === 'copy',
    noChapterAuthor: !firstTry && !query['rft.authorOfComponent'] && query.svc_id === 'copy',
    noDate: !firstTry && !query['rft.date'] && query.svc_id === 'copy',

    onePickupLocation: (service?.pickupLocations?.length === 1),
    pickupLocations: (service.pickupLocations || []).map(x => ({
      id: x.id,
      code: x.code,
      name: x.name,
      selected: x.code === query['svc.pickupLocation'] ? 'selected' : '',
    })),
    formats: ['', 'article', 'book', 'bookitem', 'journal', 'other'].map(x => ({
      code: x,
      name: x === '' ? '(None selected)' : x === 'bookitem' ? 'Book chapter' : x.charAt(0).toUpperCase() + x.slice(1),
      selected: x === query['rft.genre'] ? 'selected' : '',
    })),
    copyrightTypes: (service.copyrightTypes || []).map(x => ({
      ...x,
      selected: x.code === currentCopyrightType ? 'selected' : '',
    })),
    services: ['loan', 'copy'].map((x, i) => ({
      code: x,
      name: x.charAt(0).toUpperCase() + x.slice(1),
      checked: x === query.svc_id || (!query.svc_id && i === 0) ? 'checked' : '',
    })),
  });

  const format = data.formats.filter(x => x.selected);
  if (format.length === 0) {
    // Nothing explicitly selected, so default from service-type
    if (data.services[0].checked) {
      data.formats[2].selected = 'selected';
    }
  }

  return data;
}


async function maybeRenderForm(ctx, next) {
  const { co, metadata, service, npl } = ctx.state;

  ctx.cfg.log('flow', 'Check metadata to determine if we should render form');
  if (co.hasBasicData() &&
      (npl || get(metadata, ['svc', 'pickupLocation']))) {
    return await next();
  }

  let formName;
  // Fields that are included in the form, and whose values should therefore NOT be provided as hidden inputs
  const formFields = ['svc.pickupLocation', 'rft.volume', 'svc.note', 'svc.neededBy'];
  if (co.hasBasicData()) {
    formName = 'form2';
  } else {
    formName = 'form1';
    formFields.push('rft.title', 'rft.au', 'rft.date', 'rft.pub', 'rft.place', 'rft.edition', 'rft.isbn', 'rft.oclc',
      'rft.authorOfComponent', 'rft.copyrightType', 'rft.genre', 'rft.issn', 'rft.jtitle', 'rft.pagesRequested',
      'rft.sponsoringBody', 'rft.subtitle', 'rft.titleOfComponent', 'rft.issue', 'svc_id');
  }

  ctx.cfg.log('flow', 'Rendering form', formName);
  if (!npl) {
    await Promise.all([
      service.getPickupLocations(),
      service.getCopyrightTypes(),
      service.getDefaultCopyrightType(),
    ]);
  }

  const originalQuery = co.getQuery();
  const query = {};
  Object.keys(originalQuery).forEach(key => {
    query[key] = unArray(originalQuery[key]);
  });

  const ntries = query['svc.ntries'] || '0';
  query['svc.ntries'] = (parseInt(ntries) + 1).toString();

  if (!query['rft.title']) {
    query['rft.title'] = query['rft.btitle'] || query['rft.atitle'] || query['rft.jtitle'];
  }
  if (!query['rft.au']) {
    query['rft.au'] = query['rft.creator'] || query['rft.aulast'] || query['rft.aufirst'];
  }

  const valuesNotShownInForm = Object.keys(omit(query, formFields))
    .sort()
    .map(key => `<input type="hidden" name="${key}" value="${query[key]?.replaceAll('"', '&quot;')}">`)
    .join('\n');

  const data = makeFormData(ctx, query, service, valuesNotShownInForm, parseInt(ntries) === 0);
  ctx.body = ctx.cfg.runTemplate(formName, data);
}

async function maybeReturnAdminData(ctx, next) {
  const { admindata, metadata } = ctx.state;
  if (admindata.svc?.id === 'contextObject') {
    ctx.body = { admindata, metadata };
  } else {
    await next();
  }
}

async function constructAndMaybeReturnReshareRequest(ctx, next) {
  const { admindata, co, svcCfg, symbol } = ctx.state;
  ctx.cfg.log('flow', 'Construct reshare request');
  const rr = new ReshareRequest(co);
  const rreq = rr.getRequest();
  rreq.requestingInstitutionSymbol = symbol.includes(':') ? symbol : `RESHARE:${symbol}`;

  if (svcCfg.digitalOnly) rreq.deliveryMethod = 'URL';

  ctx.cfg.log('rr', JSON.stringify(rreq));
  if (admindata.svc?.id === 'reshareRequest') {
    ctx.body = rreq;
  } else {
    ctx.state.rreq = rreq;
    await next();
  }
}

async function postReshareRequest(ctx, next) {
  const { admindata, metadata, npl, rreq, service } = ctx.state;

  ctx.cfg.log('flow', 'Post mod-rs request');
  // Provide a way to provoke a failure (for testing): include ctx_FAIL in the OpenURL
  const path = get(admindata, 'ctx.FAIL') ? '/not-there' : '/rs/patronrequests';
  const res = await service.post(path, rreq);
  const body = await res.text();
  ctx.cfg.log('posted', `sent request, status ${res.status}`);

  if (!res.ok) {
    ctx.cfg.log('error', `POST error ${res.status}:`, body);
  }

  if (admindata.svc?.id === 'json') {
    ctx.set('Content-Type', 'text/json');
    ctx.body = {
      status: res.status,
      message: body,
      contextObject: { admindata, metadata },
      reshareRequest: rreq,
    };
  } else {
    ctx.set('Content-Type', 'text/html');
    const vars = { status: res.status.toString() };
    try {
      vars.json = JSON.parse(body);
    } catch (e) {
      vars.json = {};
      vars.text = body;
    };

    if (!npl) {
      await service.getPickupLocations();
      const location = find(service.pickupLocations, x => x.code === vars.json.pickupLocationSlug);
      if (location) vars.pickupLocationName = location.name;
    }

    ctx.body = ctx.cfg.runTemplate(res.ok ? 'good' : 'bad', vars);
  }
};

class OpenURLServer {
  constructor(cfg) {
    this.services = {};

    const serviceConfigs = cfg.getValues().services || [];
    Object.keys(serviceConfigs).forEach(label => {
      this.services[label] = new OkapiSession(cfg, label, serviceConfigs[label]);
    });

    // Default service
    if (cfg.getValues().okapiUrl) this.services[''] = new OkapiSession(cfg);

    const docRoot = cfg.getValues().docRoot;
    if (!docRoot) {
      throw new Error('No docRoot defined in configuration');
    }
    const koaStatic = KoaStatic(`${cfg.path}/${docRoot}`);

    const app = new Koa();
    app.context.cfg = cfg;
    app.context.services = this.services;

    // koa-static doesn't call next() if it matches so we could almost have just used it except for
    // the fact we want to only conditionally return index.html at root
    //
    // We could almost use koa-router at the top level here but we have services combined with /static
    // and potentially other fixed endpoints so it'd need some awkward regexen.
    //
    // Instead, this top level middleware is essentially a router. koa-compose can bring together the
    // OpenURL pieces and we can potentially use koa-router for other parts if we end up adding
    // functionality
    app.use(async function(ctx, next) {
      if (ctx.path.startsWith('/static/') ||
          ctx.path === '/favicon.ico' ||
          (ctx.path === '/' && ctx.search === '')) {
        return koaStatic(ctx, next);
      }
      return compose([
        parseRequest,
        maybeRenderForm,
        maybeReturnAdminData,
        constructAndMaybeReturnReshareRequest,
        postReshareRequest,
      ])(ctx, next);
    });

    this.app = app;
  }

  initializeOkapiSessions() {
    return Promise.all(
      Object.keys(this.services).map(label => this.services[label].login())
    );
  }

  listen(...args) {
    return this.app.listen(...args);
  }
}

module.exports = { OpenURLServer };
