// Creates an OpenURL server that contains a configured Koa app.

const Koa = require('koa');
const _ = require('lodash');
const { ContextObject } = require('./ContextObject');
const { ReshareRequest } = require('./ReshareRequest');
const { OkapiSession } = require('./OkapiSession');
const HTTPError = require('./HTTPError');

class OpenURLServer {
  constructor(cfg) {
    this.okapi = new OkapiSession(cfg);
    this.cfg = cfg;

    this.app = new Koa();
    this.app.use(ctx => {
      if (ctx.path === '/favicon.ico') {
        return this.serveStatic(ctx, 'favicon.ico');
      } else if (ctx.path.startsWith('/static/')) {
        return this.serveStatic(ctx, ctx.path.substring(8));
      }

      const co = new ContextObject(cfg, ctx.query);
      cfg.log('co', `got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
      const admindata = co.getAdmindata();
      const metadata = co.getMetadata();
      cfg.log('admindata', JSON.stringify(admindata, null, 2));
      cfg.log('metadata', JSON.stringify(metadata, null, 2));

      if (_.get(admindata, ['svc', 'id']) === 'contextObject') {
        return new Promise((resolve) => {
          ctx.body = { admindata, metadata };
          resolve();
        });
      }

      const rr = new ReshareRequest(co);
      const req = rr.getRequest();
      cfg.log('rr', JSON.stringify(req, null, 2));
      // Provide a way to provoke a failure (for testing): include ctx_FAIL in the OpenURL
      const path = _.get(admindata, 'ctx.FAIL') ? '/not-there' : '/rs/patronrequests';
      return this.okapi.post(path, req)
        .then(res => {
          return res.text()
            .then(body => {
              cfg.log('posted', `sent request, status ${res.status}`);
              ctx.set('Content-Type', 'text/html');
              try {
                ctx.body = this.htmlBody(res, body);
              } catch (e) {
                ctx.response.status = 500;
                ctx.body = e.message;
              }
            });
        });
    });
  }

  okapiLogin() { return this.okapi.login(); }
  listen(...args) { return this.app.listen(...args); }

  serveStatic(ctx, filename) {
    if (filename.indexOf('../') === 0 || filename.indexOf('/../') !== -1) {
      throw new HTTPError(403, 'unsanitary path');
    }

    const dir = this.cfg.getValues().staticPath;
    if (!dir) {
      throw new HTTPError(500, 'no staticPath defined in configuration');
    }

    try {
      ctx.body = this.cfg.readFile(`${dir}/${filename}`);
    } catch (e) {
      if (e.code === 'ENOENT') throw new HTTPError(404, `cannot find '${filename}'`);
      if (e.code === 'EACCES') throw new HTTPError(403, `permission denied for '${filename}'`);
      throw new HTTPError(500, `system error reading '${filename}'`);
    }

    // Perhaps this table should be read from the configuration? Maybe not.
    const ext2contentType = {
      'txt': 'text/plain',
      'html': 'text/html',
      'png': 'image/png',
      'gif': 'image/gif',
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
    };
    const ext = filename.replace(/.*\./, '').toLowerCase();
    ctx.type = ext2contentType[ext];
  }

  htmlBody(res, text) {
    const status = `${res.status}`;

    const vars = { status };
    try {
      const json = JSON.parse(text);
      vars.json = json;
    } catch (e) {
      vars.text = text;
    };

    const ok = (status[0] === '2');
    const template = this.cfg.getTemplate(ok ? 'good' : 'bad');
    return template(vars);
  }
}

module.exports = { OpenURLServer };
