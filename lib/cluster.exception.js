/*!
 * cluster.exception
 * Copyright(c) 2011 Arnout Kazemier <info@3rd-Eden.com>
 * MIT Licensed
 */
 

/**
 * Module dependencies
 */
var os = require('os')
  , fs = require('fs')
  , jade = require('jade')
  , formatting = require('./format')
  , format = formatting.format
  , timestamp = formatting.timestamp
  , History = require('./history')
  , Email = require('email').Email;

/**
 * Cluster.exception allows you to receive emails of uncaught exceptions in your
 * node.js applications. Not only the error is send but also a history of the 
 * `console` statements, memory, cpu, etc, etc, the whole chabang. This might
 * give you a better context on why the error was occuring in the first place.
 *
 * @param {Object} options The configurable options for the cluster.exceptions plugin.
 * @param {String} options.from The `from` address field for the e-mail.
 * @param {String} options.template The template that is send in the e-mail, can be `default`, `history` and `basic`.
 * @param {Object} options.history Options to configure the history generator
 * @returns {Function} the configured plugin for the `cluster.use` method.
 * @api public
 */
exports = module.exports = function exception(options){
  options = options || {};
  
  var log = {}
    , to = []
    , from = options.from || 'cluster@dev.null'
    , subject = options.subject || 'Cluster.exception {date}'
    , methods = options.methods || ['log','info','warn','error']
    , template = options.template || 'default'
    , history;
  
  if (!options.to) throw Error("Please specify a e-mail address for the cluster.exception plugin");
  Array.prototype.push[ Array.isArray(options.to) ? 'apply' : 'call'](to, options.to);
  
  /**
   * Provides a JSON view of the current environment details such
   * as load, memory usage, versioning information and so on.
   *
   * @param {Error} exception The unchaught exception.
   * @param {Cluster} instance A reference to the cluster object.
   * 
   * @returns {Object} details about the exception.
   * @api private
   */
  function exception(error, instance){
    var master = instance.master ? instance.master : instance
      , details = {
      
      // Details about the current environment of the Node process
      // this can be helpfull if you have multiple `cluster` instances
      // running and reporting to the same account.
      environment: {
        root: process.cwd()
      , arguments: process.argv
      , env: process.env
      , gid: process.getgid()
      , uid: process.getuid()
      , pid: process.pid
      , versions: {
          node: process.versions.node
          , v8: process.versions.v8
          , ares: process.versions.ares
          , libev: process.versions.ev
        }
      }
      
      // Some basic details about the current OS we are running on.
    , os: {
        platform: process.platform
      , type: os.type()
      , release: os.release()
      , hostname: os.hostname()
      }
      
      // The actual error that occured.
    , exception: {
        message: error.message
      , stack: error.stack
      }
      
      // Details about the cluster instance.
    , cluster: {
        child: instance.isChild
      , worker: instance.isWorker
      , master: instance.isMaster
      , state: master.state
      , masterPID: process.env.CLUSTER_MASTER_PID || process.env.CLUSTER_PARENT_PID
      , env: instance.env
      , startup: instance.startup
      }
      
      // When did the exception occure.
    , date: timestamp()
    };
    
    // if we have log interception enabled, we are going
    // to add these to the details aswel.
    if (methods.length){
      details.log = {};
      methods.forEach(function addLogs(type){
        details.log[type] = log[type].join('\n');
      });
    }
    
    // add the graphs.
    if (history && history.keys.length){
      details.graph = {};
      history.keys.forEach(function addGraphs(key){
        var graphs = history.toGraph(key)
          , graph;
          
        for(graph in graphs) details.graph[graph] = graphs[graph];
      });
    }
    
    // add more cluster details
    if (master._killed) details.cluster.killed = master_killed;
    if (master.children && master.children.length) details.cluster.workers = master.children.length;
    if (process.env.CLUSTER_WORKER) details.cluster.worker_id = process.env.CLUSTER_WORKER;
    if (process.env.CLUSTER_REPLACEMENT_MASTER) details.cluster['master replacement'] = true;
    
    return details;
  };
    
  /**
   * Simple string based replaces / template system.
   *
   * @param {String} string The template.
   * @param {Object} data The data that is used to replace variables from the string.
   *
   * @returns {String} result
   * @api private
   */
  function replace(string,data){
    for(var param in data){
      string = string.replace(new RegExp('{'+ param +'}','g'), data[param]);
    }
    return string;
  };
  
  /**
   * Override the console object and capture the messages so we
   * can send them together with a potential error report to provide
   * more context for the error.
   */
  methods.forEach(function replaceConsole(type){
    var original = global.console[type];
    log[type] = [];

    global.console[type] = function(){
      log[type].push(timestamp() + ' - ' +format.apply(this, arguments));
      
      // remove items from the log
      if (log[type].length > 25) log[type].shift();
      
      // make sure the original functionality still works
      original.apply(console, arguments);
    };
  });
    
  /**
   * Pre-compile the email template.
   */
  template = jade.compile(
    fs.readFileSync(
        require('path').join(
            __dirname
          , '../views/' + template + '.jade'
        )
      , 'utf-8'
    )
  );
  
  /**
   * The actual plugin.
   *
   * @param {Cluster} instance A worker or client instance.
   * @api public
   */
  function plugin(instance){
    
    // Start tracking the process history
    history = new History(options.history || false);
  
    // Add a listener to the process
    process.on("uncaughtException", function captureException(error){
      var details = exception(error, instance)
        , message = {
            subject: replace(subject, details)
          , from: from
          , to: to
          , bodyType: 'html'
          , body: template(details)
        };
            
      // send the e-mail
      var sendmail = new Email(message);
      sendmail.send(function(err){
        if (err){
          console.error(err.message);
          console.log(timestamp() + 'Failed to send cluster.exception mail, outputting details to stdout:');
          console.dir(details);
        } else {
          console.log(timestamp() + ' Great success! Cluster.exception mail send.');
        }
      });
      
      // mimic the default uncaught exception handling for workers
      // see https://github.com/LearnBoost/cluster/blob/master/lib/worker.js#L95
      if (instance.isWorker){
        // stderr for logs
        console.error(error.stack || error.message);
        
        // report exception
        instance.master.call('workerException', error)
        
        // exit
        process.nextTick(function(){
          instance.destroy();
        });
      }
    });
  };
  
  // Make sure that we also have it called inside the workers
  // because we want to gather addional data.
  plugin.enableInWorker = true;
  return plugin;
};

/**
 * Library version.
 */
exports.version = "0.0.1";