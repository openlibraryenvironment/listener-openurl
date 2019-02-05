const Koa = require('koa');
const app = new Koa();
// const Logger = require('stripes-logger');
// const l = new Logger(process.env.LOGGING_CATEGORIES || process.env.LOGCAT);
const { ContextObject } = require('./ContextObject');

app.use(ctx => {
  const co = new ContextObject(ctx.query);
  console.log(`got ContextObject ${co.getType()} query`, JSON.stringify(co.getQuery(), null, 2));
  ctx.body = 'OpenURL request received\n';
});

app.listen(3000);
console.log('ready');
