/*!
 * cluster.exception
 * Copyright(c) 2011 Arnout Kazemier <info@3rd-Eden.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */
var os = require('os');

/**
 * The `History` function takes snapshots of the cpu / memory to
 * create a more realisic overview of the of what was happing before
 * an error got triggered as some errors might be related to CPU spikes
 * and other operating system based details.
 *
 * @constructor
 * @param {Object} options Configurable option set
 * @param {Number} options.limit The maximum log length before we start removing older entries
 * @param {Number} options.duration Amount in miliseconds that a snapshot should be taken
 *
 * @api private
 */
 
var History = module.exports = function(options){
  var self = this;
  
  this.limit = 50;
  this.duration = 1000*25;
  
  // overwite our data with options, if needed
  if (options)
    for (var key in options) this[key] = options[key];
  
  this.stats = {
      'loadaverage': os.loadavg
    , 'cpus': os.cpus
    , 'freemem': os.freemem
    , 'totalmem': os.totalmem
    , 'memory': process.memoryUsage
  };
  this.data = {};
  this.keys = Object.keys(this.stats);
  
  // initiate the History
  this.keys.forEach(function(key){
    self.data[key] = [];
  });
  this.interval = setInterval(function(){
    self.update.call(self)
  }, this.duration);
};

/**
 * Updates the data with a new stat dump. If the data exceeds the allowed
 * limit we will remove the a old item from the data structure so we will
 * have a fresh feed of data.
 *
 * @api private
 */
History.prototype.update = function(){
  var i = this.keys.length
    , key;
    
  while(i--){
    key = this.keys[i];
    
    this.data[key].push( this.stats[key]() );
    if (this.data[key].length > this.limit) this.data[key].shift();
  };
};

/**
 * Exports the gathered history as a `Google chart` graph.
 * 
 * @param {String} key The stat that needs to be converted to a chart
 *
 * @returns {Object} Key => url
 * @api public
 */
History.prototype.toGraph = function(key){
  var base = 'https://chart.googleapis.com/chart?cht=ls&chs=400x150&chco=3B88D8&chts=222222,14&chd='
    , data = this.data[key]
    , i = data.length
    , points = []
    , result = {};
  
  switch (key){
    case 'memory':
      ['rss', 'vsize', 'heapUsed', 'heapTotal'].forEach(function(type){
        points.length = 0;
        i = data.length
        while(i--) points.push(History.bytesToMb(data[i][type]));
        result[type] = base + 't:' + points.join(',') + '&chtt=memoryUsage+'+ type;
      });
      break;
      
    case 'freemem': case 'totalmem':
      while(i--) points.push(History.bytesToMb(data[i]));
      result[key] = base + 't:' + points.join(',') + '&chtt=Server+'+ key;
      break;
    
    case 'cpus':
      break;
  }
  
  return result;
};

History.prototype.destroy = function(){
  clearInterval(this.interval);
  this.data = null;
};

/**
 * Simple conversion method, for transforming bytes in to megabytes
 *
 * @returns {Number}
 * @api public
 */
History.bytesToMb = function(bytes){
  return Math.round(bytes/1024/1024);
};