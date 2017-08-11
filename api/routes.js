// var body = require('koa-better-body');
const router = require('koa-better-router')().loadMethods();

router.get('*', (ctx) => {
    ctx.render('index');
});

module.exports = {router};
