var http = require('http')
  , cluster = require('cluster')
  , exception = require('../');
  

var app = http.createServer(function(req, res){
  res.writeHead(200);
  res.end("hello world");
});

cluster(app)
  .use(cluster.logger('logs'))
  .use(cluster.stats())
  .use(cluster.pidfiles('pids'))
  .use(cluster.cli())
  .use(cluster.repl(8888))
  .use(exception({to: ['info@3rd-Eden.com', 'hello@3rd-Eden.com']}))
  .listen(8080)