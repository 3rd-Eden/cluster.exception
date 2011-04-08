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
  , format = require('./format')
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
    , methods = options.methods || ['log','info','warn','error'];
  
  if (!options.to) throw Error("Please specify a e-mail address");
  Array.prototype.push[ Array.isArray(options.to) ? 'apply', 'call'](to, options.to);
  
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
    , os: {
        platform: process.platform
      , type: os.type()
      , release: os.release()
      , hostname: os.hostname()
      }
    , stats: {
        loadaverage: os.loadavg()
      , cpus: os.cpus()
      , freemem: os.freemem()
      , totalmem: os.totalmem()
      , memory: process.memoryUsage()
      }
    , exception: {
        message: error.message
      , stack: error.stack
      }
    , cluster: {
    
      }
    };
    
    if (method.length){
      methods.forEach(function(type){
        details.log[type] = log[type].join('\n');
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
    var origional = console[type];
    log[type] = [];
    
    console[type] = function(){
      log[type].push(format.apply(this, arguments));
      
      // remove items from the log
      if (log[type].length > 25) log[type].shift();
      
      // make sure the original functionality still works
      origional.apply(console, arguments);
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