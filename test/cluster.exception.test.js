
/**
 * Module dependencies.
 */

var cluster.exception = require('cluster.exception')
  , should = require('should');

module.exports = {
  'test .version': function(){
    cluster.exception.version.should.match(/^\d+\.\d+\.\d+$/);
  }
};