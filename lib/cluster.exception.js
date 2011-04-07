/*!
 * cluster.exception
 * Copyright(c) 2011 Arnout Kazemier <info@3rd-Eden.com>
 * MIT Licensed
 */

exports = module.exports = function(options){
  options = options || {};
  
  function exception(error, cluster){
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
    , error: {
        message: error.message
      , stack: error.stack
      }
    , cluster: {
    
      }
    };
  }
  
  /**
   *
   * @param {Cluster} cluster A worker or client instance
   */
  function plugin(cluster){
    // Add a listener to the process
    process.on("uncaughtException", function(){
    
    });
  };
  
  // Make sure that we also have it called
  plugin.enableInWorker = true;
  return plugin;
};

/**
 * Library version.
 */
exports.version = "0.0.0";