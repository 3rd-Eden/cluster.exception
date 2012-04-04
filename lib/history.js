"use strict";

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

var History = module.exports = function History (options) {
  var self = this;

  this.limit = 50;
  this.duration = 1000 * 25;

  // overwite our data with options, if needed
  if (options) {
    for (var key in options) this[key] = options[key];
  }

  this.stats = {
      'loadaverage': os.loadavg
    , 'cpus': os.cpus
    , 'freemem': os.freemem
    , 'memory': process.memoryUsage
  };

  this.data = {};
  this.totalmem = History.bytesToMb(os.totalmem());
  this.keys = Object.keys(this.stats);

  // initiate the History
  this.keys.forEach(function createDataStructure (key) {
    self.data[key] = [];
  });

  this.interval = setInterval(function historyUpdate () {
    self.update.call(self);
  }, this.duration);
};

/**
 * Updates the data with a new stat dump. If the data exceeds the allowed
 * limit we will remove the a old item from the data structure so we will
 * have a fresh feed of data.
 *
 * @api private
 */

History.prototype.update = function update () {
  var i = this.keys.length
    , key;

  while (i--) {
    key = this.keys[i];

    this.data[key].push( this.stats[key]() );
    if (this.data[key].length > this.limit) this.data[key].shift();
  }
};

/**
 * Exports the gathered history as a `Google chart` graph.
 *
 * @param {String} key The stat that needs to be converted to a chart
 *
 * @returns {Object} Key => url
 * @api public
 */

History.prototype.toGraph = function toGraph (key) {
  var url = 'https://chart.googleapis.com/chart?cht=ls&chs=400x150&chts=222222,14'
    , base = url + '&chco=3B88D8&chd='
    , data = this.data[key]
    , i = data.length
    , points = []
    , result = {}
    , tmp = {};

  switch (key) {
    case 'memory':
      ['rss', 'vsize', 'heapUsed', 'heapTotal'].forEach(function generate (type) {
        points.length = 0;
        i = data.length;

        if (i) {
          while (i--) points.push(History.bytesToMb(data[i][type]));

          tmp.sorted = points.sort(function sortTimes (a,b) {
            return b - a;
          });

          tmp.high = tmp.sorted[0];

          result['mem_' + type] = base + 't:' + points.join(',') + '&chtt=Process+memory+usage+'+ type + '+(MB)' +
            '&chds=0,' + tmp.high +
            '&chxr=0,0,' + tmp.high +'&chxt=r';
        }
      });
      break;

    case 'freemem':
      if (i){
        while (i--) points.push(this.totalmem - History.bytesToMb(data[i]));

        tmp.sorted = points.sort(function sortTimes (a,b) {
          return b - a;
        });

        tmp.high = tmp.sorted[0];

        result['mem_' + key] = base + 't:' + points.join(',') + '&chtt=Total+memory+(limit+'+ this.totalmem+'+MB)' +
            '&chds=0,' + this.totalmem +
            '&chxr=0,0,' + this.totalmem +'&chxt=r';
      }
      break;

    case 'cpus':
      // no data, return.. nothing
      if (!data[0] || !i) return result;

      data[0].forEach(function getCPUNames (cpu, index) {
        var name = 'CPU ' + ( index + 1) + ' ' + cpu.model
          , time;

        tmp[name] = {};

        for (time in cpu.times) {
          tmp[name][time] = [];
        }
      });

      while (i--) {
        data[i].forEach(function getCPUTimes (cpu, index) {
          var name = 'CPU ' + ( index + 1) + ' ' + cpu.model
            , time;

          for (time in cpu.times) {
            tmp[name][time].push(cpu.times[time]);
          }
        });
      }

      Object.keys(tmp).forEach(function assempleCPUResult (cpu) {
        var times = tmp[cpu]
          , time;

        tmp.labels = [];
        tmp.counts = [];
        tmp.lowest = 9E99;
        tmp.highest = 0;

        for (time in times) {
          if (time === 'nice' || time === 'irq') continue;

          tmp.sorted = times[time].sort(function sortTimes (a,b) {
            return b - a;
          });

          tmp.high = tmp.sorted[0];
          tmp.low = tmp.sorted[ tmp.sorted.length - 1 ];
          tmp.low = tmp.low === tmp.high ? 0 : tmp.low;

          tmp.lowest = tmp.lowest > tmp.low ? tmp.low : tmp.lowest;
          tmp.highest = tmp.highest > tmp.high ? tmp.highest : tmp.high;

          tmp.counts.push(times[time].join(','));
          tmp.labels.push(time);
        }

        result['cpu_' + cpu ] = url + '&chd=t:' + tmp.counts.join('|') + '&chdl=' + tmp.labels.join('|') +
            '&chco=DA3B15,F7A10A,4582E7,579F3A,9100E5&chxt=r&chdlp=t&chtt=' + cpu.split(' ').join('+') +
            '&chds=' + tmp.lowest + ',' + tmp.highest +
            '&chxr=0,'  + tmp.lowest + ',' + tmp.highest;
      });
      break;

    case 'loadaverage':
      if (i) {
        tmp.labels = {
          '0': 'Server load 1 minute interval'
        , '1': 'Server load 5 minutes interval'
        , '2': 'Server load 15 minutes interval'
        };

        Object.keys(tmp.labels).forEach(function (key) {
          points = [];
          i = data.length;

          while (i--) {
            points.push(data[i][key]);
          }

          tmp.sorted = points.sort(function sortTimes (a,b) {
            return b - a;
          });

          tmp.high = tmp.sorted[0];

          result['load_' + key] = base + 't:' + points.join(',') + '&chtt='+ tmp.labels[key] +
              '&chds=0,' + tmp.high +
              '&chxr=0,0,' + tmp.high +'&chxt=r';
        });
      }
      break;
  }

  return result;
};

/**
 * Clear the running interval and clean the recoreded
 * data.
 *
 * @api public
 */

History.prototype.destroy = function destroy () {
  clearInterval(this.interval);
  this.data = null;
};

/**
 * Simple conversion method, for transforming bytes in to megabytes
 *
 * @returns {Number}
 * @api public
 */

History.bytesToMb = function bytesToMb (bytes) {
  return Math.round(bytes/1024/1024);
};
