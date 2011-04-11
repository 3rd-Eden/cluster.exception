/**
 * @license
 * Copyright Joyent, Inc. and other Node contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * code copy / inspiration from https://github.com/joyent/node/blob/master/lib/console.js
 */

/**
 * Module dependencies
 */
var util = require('util')
  , formatRegExp = /%[sdj]/g;

/**
 * Formats arguments to a output string
 *
 * @param {Arguments} arguments The arguments that need to be formatted
 *
 * @returns {String}
 * @api public
 */
function format(f) {
  if (typeof f !== 'string') {
    for (var objects = [], i = 0, length = arguments.length; i < length; i++) {
      objects.push(util.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1
    , args = arguments
    , length = args.length
    , str = String(f).replace(formatRegExp, function(x) {
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j': return JSON.stringify(args[i++]);
        default:
          return x;
      }
    });
    
  for (var x = args[i]; i < length; x = args[++i]) {
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + util.inspect(x);
    }
  }
  
  return str;
};

/**
 * Generate a new timestamp
 *
 * @returns {String} Timestamp in `26 Feb 16:19:34` format
 * @api public
 */
function timestamp() {
  var d = new Date()
    , pad = timestamp.pad
    , months = timestamp.months
    , time = [
        pad(d.getHours())
      , pad(d.getMinutes())
      , pad(d.getSeconds())
      ].join(':');
  
  return [d.getDate(), months[d.getMonth()], time].join(' ');
};

/**
 * Added a leading zero infront of numbers when
 * they are less than 10
 *
 * @param {Number} n The number that needs to be padded
 *
 * @returns {String} a padded string
 * @api public
 */
timestamp.pad = function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
};

/**
 * A array with months, for the timestamp function
 *
 * @type {Object}
 * @api public
 */
timestamp.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.timestamp = timestamp;
exports.format = format;