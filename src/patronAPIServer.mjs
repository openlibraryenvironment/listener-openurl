import Koa from 'koa';
import queryString from 'query-string';
import { bodyParser } from '@koa/bodyparser';
import Router from '@koa/router';
import { OkapiSession } from './OkapiSession.js';
import idTransform from './idTransform.js';


const passOkapiResponse = (response, fromOkapi) => {
  // hmm, it didn't like when I tried to flow through the encoding...
  const passHeaders = ['Content-Type'];
  passHeaders.forEach(h => {
    if (fromOkapi.headers?.has(h)) response.set(h, fromOkapi.headers.get(h));
  });

  response.status = fromOkapi.status;
  // The fetch() API returns a ReadableStream but Koa's response object expects a Node Readable
  // ...conveniently node-fetch deviates from the standard to return that. If using native fetch
  // you'd convert via:
  // ctx.response.body = Readable.fromWeb(fromOkapi.body);
  response.body = fromOkapi.body;
};

const router = new Router();

router.all('/:service/(.*)', async (ctx, next) => {
  const service = ctx.params?.service;
  const sess = ctx.services?.[service];
  if (!sess) ctx.throw(404, `Unrecognized service ${service}`);
  ctx.state.sess = sess;
  const svcCfg = ctx.cfg.getServiceValues(service);
  ctx.state.svcCfg = svcCfg;
  await next();
});

router.get('/:service/patronrequests', async (ctx, next) => {
  const { sess, svcCfg } = ctx.state;
  if (!svcCfg.reqIdHeader) ctx.throw(400, 'Service config does not specify header for patron id');

  const patronId = idTransform(ctx.request?.headers?.[svcCfg.reqIdHeader], svcCfg);
  if (typeof patronId !== 'string' || patronId.length < 1) ctx.throw(400, 'Configured patron id header missing value');

  // Constrain query to patron id
  const query = queryString.parse(ctx.request.querystring);
  const patronFilter = `patronIdentifier==${patronId}`;
  if (Array.isArray(query.filters)) query.filters.push(patronFilter);
  else if (typeof query.filters === 'string') query.filters = [query.filters, patronFilter];
  else query.filters = [patronFilter];

  const pathWithQuery = `/rs/patronrequests?${queryString.stringify(query)}`;
  ctx.cfg.log('flow', `Passing through request with query ${ctx.request.querystring} to ${pathWithQuery}`);
  const fromOkapi = await sess.okapiFetch('GET', pathWithQuery);
  passOkapiResponse(ctx.response, fromOkapi);

  await next();
});

router.post('/:service/patronrequests/:prid/cancel', async (ctx, next) => {
  const { sess } = ctx.state;
  const opts = (({ reason, note }) => ({ reason, note }))(ctx.request.body);
  ctx.cfg.log('flow', `Cancelling request ${ctx.params.prid} with reason ${opts.reason}`);
  const fromOkapi = await sess.okapiFetch('POST', `/rs/patronrequests/${ctx.params.prid}/performAction`,
    { action: 'requesterCancel', actionParams: opts });

  passOkapiResponse(ctx.response, fromOkapi);
  await next();
});

router.post('/:service/patron/validate', async (ctx, next) => {
  const { sess } = ctx.state;
  ctx.cfg.log('flow', 'Passing through validation request');
  const fromOkapi = await sess.okapiFetch('POST', '/rs/patron/validate', ctx.request.body);

  passOkapiResponse(ctx.response, fromOkapi);
  await next();
});

async function patronAPIServer(cfg) {
  const serviceConfigs = cfg.getValues().services;
  const services = {};
  Object.keys(serviceConfigs || []).forEach(label => {
    services[label] = new OkapiSession(cfg, label, serviceConfigs[label]);
  });

  // Default service
  if (cfg.getValues().okapiUrl) services[''] = new OkapiSession(cfg);

  const docRoot = cfg.getValues().docRoot;
  if (!docRoot) {
    throw new Error('No docRoot defined in configuration');
  }

  const app = new Koa();
  app.context.cfg = cfg;
  app.context.services = services;

  app.use(bodyParser());
  app.use(router.routes());

  // initialize Okapi sessions
  await Promise.all(
    Object.keys(services).map(label => services[label].login())
  );

  return app;
}

export default patronAPIServer;
