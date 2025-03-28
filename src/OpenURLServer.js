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

  // service can come from path OR parameter
  const symbol = get(metadata, ['res', 'org']) || ctx.path.replace(/^\//, '');
  ctx.cfg.log('flow', 'Check service', symbol);
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


async function checkLimit(ctx, next) {
  const { admindata, service, svcCfg } = ctx.state;
  const uid = admindata.req?.id;

  // Check to see if this request would put us over the limit
  // This isn't responsible for enforcing the limit but offers a way to reject
  // the request early rather than creating one with state REQ_OVER_LIMIT
  let overLimit = false;
  if (svcCfg.checkLimit && uid) {
    ctx.cfg.log('flow', 'Checking request limit');
    try {
      const [maxResponse, reqsResponse] = await Promise.all([
        service.okapiFetch('GET', '/rs/settings/appSettings?filters=section%3D%3Drequests&filters=key%3D%3Dmax_requests'),
        service.okapiFetch('GET', `/rs/patronrequests?perPage=1000&filters=state.terminal%3D%3Dfalse&filters=isRequester%3D%3Dtrue&filters=patronIdentifier%3D%3D${uid}`),
        // TODO this would be better but we need to be sure it will match if any of the tags does
        // service.okapiFetch('GET', `/rs/patronrequests?perPage=1000&filters=state.tags.value%3D%3DACTIVE_PATRON&filters=isRequester%3D%3Dtrue&filters=patronIdentifier%3D%3D${uid}`),
      ]);
      if (!maxResponse.ok) throw new Error(`HTTP error getting request limit ${maxResponse.status}`);
      if (!reqsResponse.ok) throw new Error(`HTTP error getting requests to check limit ${reqsResponse.status}`);

      // Setting a limit is optional and one may not be configured
      const maxReqs = (await maxResponse.json())?.[0]?.value;
      if (maxReqs) {
        const reqs = await reqsResponse.json();
        const reqsThatCount = reqs.filter(pr => pr.state?.tags?.some(tag => tag.value === 'ACTIVE_PATRON'));
        overLimit = reqsThatCount.length >= maxReqs;
        ctx.cfg.log('flow', `User has ${reqsThatCount.length} requests, limit is ${maxReqs}. Are we at the limit? ${overLimit}.`);
      } else {
        ctx.cfg.log('flow', 'No limit configured');
      }
    } catch (e) {
      ctx.cfg.log('error', 'Problem checking request limit', e);
    }
  }

  if (overLimit) {
    ctx.cfg.log('flow', 'Request over limit');
    ctx.body = ctx.cfg.runTemplate('limit');
  } else {
    await next();
  }
}


// Used to protect against keys that are included multiple times
function unArray(val) {
  while (Array.isArray(val)) val = val[0];
  return val;
}


async function makeFormData(ctx, query, service, valuesNotShownInForm, firstTry, npl) {
  const isCopy = query.svc_id === 'copy';
  query.svc_id ||= 'loan';

  const promises = [
    service.listServiceLevels(),
    service.listCurrencies()
  ];
  if (!npl) {
    promises.push(
      service.listCopyrightTypes(),
      service.listPickupLocations(),
      service.listDefaultCopyrightType(),
    );
  }

  const res = await Promise.all(promises);
  const [serviceLevels, currencies, copyrightTypes, pickupLocations, defaultCopyrightType] = res;
  const currentCopyrightType = query['rft.copyrightType'] || defaultCopyrightType;

  const data = Object.assign({}, query, {
    valuesNotShownInForm,
    digitalOnly: ctx.state?.svcCfg?.digitalOnly,
    firstTry,
    npl,
    isCopy,

    // Annoyingly, Handlebars' {{#if NAME}} does not work with dotted names like `rft.genre`, so we need these redundant booleans
    hasGenre: !!query['rft.genre'],
    hasDate: !!query['rft.date'],
    hasISBN: !!query['rft.isbn'],

    onePickupLocation: (pickupLocations?.length === 1),
    pickupLocations: (pickupLocations || []).map(x => ({
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
    copyrightTypes: (ctx.cfg.getValues()?.copyrightTypes || copyrightTypes || []).map(x => ({
      ...x,
      selected: x.code === currentCopyrightType ? 'selected' : '',
    })),
    services: ['loan', 'copy'].map((x, i) => ({
      code: x,
      name: x.charAt(0).toUpperCase() + x.slice(1),
      checked: x === query.svc_id || (!query.svc_id && i === 0) ? 'checked' : '',
    })),
    serviceLevels: (ctx.cfg.getValues()?.serviceLevels || serviceLevels || []).map(x => ({
      ...x,
      selected: x.code === query['svc.level'] ? 'selected' : '',
    })),
    currencies: (currencies || []).map(x => ({
      ...x,
      selected: x.code === query['svc.costCurrency'] ? 'selected' : '',
    })),
    pubDateValidation: ctx.state?.svcCfg?.allowAnyDate ? '' : 'pattern="[0-9]*" ',
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
  const { co, metadata, service, npl, svcCfg } = ctx.state;

  ctx.cfg.log('flow', 'Check metadata to determine if we should render form');
  const pickupLocationRequirementSatisfied = (npl ||
    !!get(metadata, ['svc', 'pickupLocation']) ||
    co.admindata.svc?.id === 'copy'
  );
  const firstTime = !co.getQuery()['svc.ntries'];
  const insistOnForm = svcCfg.alwaysShowForm && firstTime;
  if (co.hasBasicData() && pickupLocationRequirementSatisfied && !insistOnForm) {
    return await next();
  }

  let formName;
  // Fields that are included in the form, and whose values should therefore NOT be provided as hidden inputs
  const formFields = ['svc.pickupLocation', 'rft.volume', 'svc.note', 'svc.neededBy'];
  if (co.hasBasicData() && !metadata.svc?.longForm) {
    formName = 'form2';
  } else {
    formName = 'form1';
    formFields.push('rft.title', 'rft.au', 'rft.date', 'rft.pub', 'rft.place', 'rft.edition', 'rft.isbn', 'rft.oclc',
      'rft.authorOfComponent', 'rft.copyrightType', 'rft.genre', 'rft.issn', 'rft.jtitle', 'rft.pagesRequested',
      'rft.sponsoringBody', 'rft.subtitle', 'rft.titleOfComponent', 'rft.issue', 'svc_id', 'svc.level',
      'svc.costAmount', 'svc.costCurrency');
  }

  ctx.cfg.log('flow', 'Rendering form', formName);
  const originalQuery = co.getQuery();
  const query = {};
  Object.keys(originalQuery).forEach(key => {
    query[key] = unArray(originalQuery[key]);
  });

  if (formName === 'form1') {
    // Stay on this form until everything is filled in
    query['svc.longForm'] = '1';
  }

  const ntries = query['svc.ntries'] || '0'; // Always a string, though the value is numeric
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

  const data = await makeFormData(ctx, query, service, valuesNotShownInForm, parseInt(ntries) === 0, npl);
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

async function maybeAlreadyRequested(ctx, next) {
  if (ctx.query?.submitted) {
    ctx.cfg.log('flow', 'Already submitted');
    ctx.body = ctx.cfg.runTemplate('already');
  } else {
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
      const pickupLocations = await service.listPickupLocations();
      const location = find(pickupLocations, x => x.code === vars.json.pickupLocationSlug);
      if (location) vars.pickupLocationName = location.name;
    }

    vars.isCopy = vars.json?.serviceType?.value === 'copy';
    vars.hasGenre = !!vars.json?.publicationType?.value;
    vars.hasDate = !!vars.json?.publicationDate;
    vars.hasISBN = !!vars.json?.isbn;

    if (vars.isCopy) {
      let copyrightTypes = ctx.cfg.getValues()?.copyrightTypes;
      if (!copyrightTypes) {
        copyrighttypes = await service.listCopyrightTypes();
      }
      // XXX It should not be necessary to consult the request we sent, this should be in the response
      const ct = find(copyrightTypes, x => x.code === rreq.copyrightType?.value);
      if (ct) vars.clientSideCopyrightType = ct.name;
    }

    ctx.body = ctx.cfg.runTemplate(res.ok ? 'good' : 'bad', vars);
  }
};

class OpenURLServer {
  constructor(cfg) {
    this.services = {};

    const serviceConfigs = cfg.getValues().services || [];
    Object.keys(serviceConfigs).forEach(label => {
      const values = { ...serviceConfigs[label] };
      if (cfg.values.withoutOkapi) values.withoutOkapi = true;
      this.services[label] = new OkapiSession(cfg, label, values);
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
        checkLimit,
        maybeRenderForm,
        maybeReturnAdminData,
        constructAndMaybeReturnReshareRequest,
        maybeAlreadyRequested,
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
