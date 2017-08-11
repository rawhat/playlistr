const Koa = require('koa');
const Pug = require('koa-pug');
const {router} = require('./routes');

const app = new Koa();

app.use(router.middleware());

const pug = new Pug({
  viewPath: './templates',
  debug: false,
  pretty: false,
  compileDebug: false
});

pug.use(app);

app.listen(3000);
