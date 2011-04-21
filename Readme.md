# cluster.exception

Exception notification plugin for Cluster

## Installation

The easiest way to install the module is through the node package manager (npm).

    > npm install cluster.exception

Or you could clone this github repository and point your require statement to that.

    > git clone git://github.com/3rd-Eden/cluster.exception.git

## Usage

Options:

-   `from` sender email address. _Optional, should be a string. Defaults to cluster@dev.null._
-   `to` receiving email addresses. _Required, a array or string._
-   `subject` email subject. _Optional, string, can contain optional template tags. Defaults to Cluster.exception {date}._
-   `methods` console.* methods that need to be monitored. _Optional, array. Defaults to ['log','info','warn','error']._
-   `template` verbosity of the email content. _Optional, string. Defaults to default. Can either be default, basic or history._
-   `history` options for the History metrics module. _Optional, object._
    -   `limit` The amount samples it should store internally. _Optional, number. Defaults to 50._
    -   `duration` The interval of the snapshots. _Optional, number in ms. Defaults to 25 seconds (25000 ms)._

## Example

``` js
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
        console.error('Im a console.error');
        console.info(req);
    
        throw new Error("Omfg, uncaught error");
      }
    });

    cluster = cluster(app)
      .use(cluster.stats())
      .use(cluster.pidfiles('pids'))
      .use(cluster.cli())
      .use(cluster.repl(8888))
      .use(exception({to: 'your-email@ddress.here'}))
      .listen(8080);
```

Or check the [examples](https://github.com/3rd-Eden/cluster.exception/tree/master/examples) folder for more examples.

## Templates

-   `basic` This includes the **Stracktrace** and **Cluster instance** information.
-   `history` This includes the **Stracktrace**, **Cluster instance**, **Log snapshot** and **graphs**.
-   `default` This includes.. Everything you see in the screenshot below, you can never have to much information.

## Screenshots

![](http://dl.dropbox.com/u/1381492/shots/screeny-github-cluster-exception.png)

## Roadmap

The initial release will only contain support for email notifications. In the next iteration there will be support for multiple backends available. There are some use cases where you would want to store the details of the exception + the context in a database or somewhere else. So a configurable backend is something that would make a fine addition to the plugin.

Once this has been realized, I will rip out the `History` module and create a new `node-metrics` module from it, so it will be completely customizable and reusable with only the metrics that you think are important. If you have application that does allot database queries, it might be useful to know see if the queries per second where increasing, or that it took to long for your database server to respond. The possibilities are endless.

## License 

(The MIT License)

Copyright (c) 2011 Arnout Kazemier &lt;info@3rd-Eden.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.