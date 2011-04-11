var http = require('http')
  , cluster = require('cluster')
  , exception = require('../');
  
var app = http.createServer(function httpServer(req, res){
  res.writeHead(200);
  res.end("hello world");
  if(req.url.match('favicon')){
    console.info('Im a console.info');
    console.warn('Im a console.warn');
    console.log('Im a console.log');
    
    throw new Error("Omfg, uncaught error");
  }
});

cluster = cluster(app)
  .use(cluster.stats())
  .use(cluster.pidfiles('pids'))
  .use(cluster.cli())
  .use(cluster.repl(8888))
  .use(exception({to: 'info+cluster.exception@3rd-Eden.com'}))
  .listen(8080);

console.log('Staring application');