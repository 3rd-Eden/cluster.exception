/**
 * Module dependencies.
 */

var exception = require('../')
  , should = require('should')
  , cluster = require('cluster')
  , History = require('../lib/history')
  
module.exports = {
  'test .version': function(){
    exception.version.should.match(/^\d+\.\d+\.\d+$/);
  },
  
  'history module constructor': function(){
    var history = new History({duration:1000});
    history.keys.should.be.an.instanceof(Array);
    history.duration.should.eql(1000);
    
    history.should.respondTo('destroy');
    history.should.respondTo('update');
    history.should.respondTo('toGraph');
    
    history.destroy();
  },
  
  'history module data generation': function(){
    var history = new History({duration:1000});
    
    setTimeout(function(){
      history.keys.forEach(function(key){
        history.data[key].should.have.length(2);
      });
      
      history.destroy();
    }, (history.duration * 2) + 100)
  },
  
  'history module graph generation': function(){
    var history = new History({duration:100});
    
    setTimeout(function(){
      history.keys.forEach(function(key){
        var result = history.toGraph(key);
        result.should.be.an.instanceof(Object);
        
        Object.keys(result).forEach(function(key){
          if (result[key]) result[key].should.have.string('google');
        })
      });
      
      history.destroy();
    }, (history.duration * 12) + 100)
  },
  
  'exception constructor': function(){
      var plugin;
      try{ plugin = exception() }catch(e){ e.should.be.an.instanceof(Error) }
      try{ plugin = exception({}) }catch(e){ e.should.be.an.instanceof(Error) }
      
      plugin = exception({ to:'info@3rd-Eden.com' });
      plugin.should.be.an.instanceof(Function);
  },
  
  'exception accessible for workers': function(){
    var plugin = exception({ to:'info@3rd-Eden.com' });
    plugin.enableInWorker.should.be.ok
  }
};