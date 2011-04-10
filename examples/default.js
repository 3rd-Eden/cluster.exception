var http = require('http')
  , cluster = require('cluster')
  , exception = require('../');
  
var app = http.createServer(function httpServer(req, res){
  res.writeHead(200);
  res.end("hello world");
});

setTimeout(function fakeError(){
  console.log("error?");
  throw new Error("Omfg, uncaught error");
  cluster.destroy();
}, 1000);

cluster = cluster(app)
  .use(cluster.stats())
  .use(cluster.pidfiles('pids'))
  .use(cluster.cli())
  .use(cluster.repl(8888))
  .use(exception({to: 'info+cluster.exception@3rd-Eden.com'}))
  .listen(8080)