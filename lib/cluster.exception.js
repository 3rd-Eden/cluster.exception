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
 * Expose the plugin
 */
exports = module.exports = function(options){
  options = options || {};
  
  var log = {}
    , to = []
    , from = options.from || 'cluster@dev.null'
    , subject = options.subject || 'Cluster.exception {date}'
    , methods = options.methods || ['log','info','warn','error']
    , history;
  
  if (!options.to) throw Error("Please specify a e-mail address for the cluster.exception plugin");
  Array.prototype.push[ Array.isArray(options.to) ? 'apply' : 'call'](to, options.to);
  
  // Start tracking the process history
  history = new History(options.history || false);
  
  /**
   * Provides a JSON view of the current environment details such
   * as load, memory usage, versioning information and so on.
   *
   * @param {Error} exception The unchaught exception
   * @param {Cluster} instance A reference to the cluster object.
   * 
   * @returns {Object} details about the exception
   * @api private
   */
  function exception(error, instance){
    var details = {
      
      // Details about the current environment of the Node process
      // this can be helpfull if you have multiple `cluster` instances
      // running and reporting to the same account
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
      
      // Some basic details about the current OS we are running on
    , os: {
        platform: process.platform
      , type: os.type()
      , release: os.release()
      , hostname: os.hostname()
      }
      
      // The actual error that occured
    , exception: {
        message: error.message
      , stack: error.stack
      }
      
      // Details about the cluster instance
    , cluster: {
      
      }
    };
    
    // if we have log interception enabled, we are going
    // to add these to the details aswel.
    if (method.length){
      methods.forEach(function(type){
        details.log[type] = log[type].join('\n');
      });
    }
    
    // add the graphs
    if (history.keys.length){
      details.graph = {};
      history.keys.forEach(function(key){
        var graphs = history.toGraph(key)
          , graph;
          
        for(graph in graphs) details.graph[graph] = graphs[graph];
      });
    }
    
    return details;
  };
  
  /**
   * Simple string based replaces / template system.
   *
   * @param {String} string The template
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
  methods.forEach(function(type){
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
   * The actual plugin
   *
   * @param {Cluster} cluster A worker or client instance
   * @api public
   */
  function plugin(instance){
    // Add a listener to the process
    process.on("uncaughtException", function(error){
      var details = exception(error, instance);
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
exports.version = "0.0.0";