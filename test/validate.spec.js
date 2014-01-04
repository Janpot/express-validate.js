/* global describe, it */

'use strict';

var assert   = require('chai').assert,
    validate = require('../'),
    express  = require('express'),
    request  = require('supertest');


  
var VALID_SCOPES = ['route', 'body', 'query', 'cookies'];

  
function send200(req, res) {
  res.send(200);
}


describe('middleware creation', function () {
    
  
  it('should throw on invalid scope', function () {
    assert.throws(function () {
      validate({
        thing: {
          scope: 1
        }
      });
    });
    
    assert.throws(function () {
      validate({
        thing: {
          scope: 'invalid scope'
        }
      });
    });
    
    assert.throws(function () {
      validate({
        thing: {
          scope: ['invalid scope']
        }
      });
    });
    
    assert.throws(function () {
      validate({
        thing: {
          
        }
      });
    });
  });
  
  it('shouldn\'t throw on valid scope', function () {
    
    VALID_SCOPES.forEach(function (scope) {
      assert.doesNotThrow(function () {
        validate({
          thing: {
            scope: scope
          }
        });
      });
    });
    
    assert.doesNotThrow(function () {
      validate({
        thing: {
          scope: VALID_SCOPES
        }
      });
    });
  });
  
  it('should throw on invalid validator', function () {
    assert.throws(function () {
      validate({
        thing: {
          scope: VALID_SCOPES,
          invalidValidator: {}
        }
      });
    });
  });
  
  it('shouldn\'t throw on valid validator', function () {
    assert.doesNotThrow(function () {
      validate({
        thing: {
          scope: VALID_SCOPES,
          presence: true
        }
      });
    });
  });
  
  it('shouldn\'t mutate configuration object', function () {
    var config = {
      thing: {
        scope: VALID_SCOPES
      }
    };
    
    validate(config);
    
    assert.deepPropertyVal(config, 'thing.scope', VALID_SCOPES);
  });

});


describe('custom validators', function () {
  
  it('should accept custom validators', function () {
    assert.isObject(validate.validators);
  });
  
  it('should fail alwaysFail validator', function (done) {
    validate.validators.alwaysFail = function () {
      return 'Fail';
    };
    
    request(express()
      .get('/', validate({
        param: {
          scope: 'route',
          alwaysFail: true
        }
      }), send200))
      .get('/')
      .expect(400, done);
  });
  
  it('should pass alwaysPass validator', function (done) {
    validate.validators.alwaysPass = function () {
      return null;
    };
    
    request(express()
      .get('/', validate({
        param: {
          scope: 'route',
          alwaysPass: true
        }
      }), send200))
      .get('/')
      .expect(200, done);
  });
  
});


describe('middleware', function () {
  
  function assertRequest(parameter, value) {
    return function (req, res, next) {
      assert.deepPropertyVal(req, 'valid.' + parameter, value);
      next();
    };
  }
  
  it('should 400 on invalid route param within scope', function (done) {
    request(express()
      .get('/:param?', validate({
        param: {
          scope: 'route',
          presence: true
        }
      }), send200))
      .get('/')
      .expect(400, done);
  });
  
  it('should 200 on valid route param within scope', function (done) {
    request(express()
      .get('/:param', validate({
        param: {
          scope: 'route',
          presence: true
        }
      }), assertRequest('param', 'thing'), send200))
      .get('/thing')
      .expect(200, done);
  });
  
  it('should 400 on invalid query param within scope', function (done) {
    request(express()
      .get('/', validate({
        param: {
          scope: 'query',
          presence: true
        }
      }), send200))
      .get('/')
      .expect(400, done);
  });
  
  it('should 200 on valid query param within scope', function (done) {
    request(express()
      .get('/', validate({
        param: {
          scope: 'query',
          presence: true
        }
      }), assertRequest('param', 'thing'), send200))
      .get('/?param=thing')
      .expect(200, done);
  });
  
  it('should 400 on invalid cookie within scope', function (done) {
    request(express()
      .use(express.cookieParser())
      .get('/', validate({
        param: {
          scope: 'cookies',
          presence: true
        }
      }), send200))
      .get('/')
      .expect(400, done);
  });
  
  it('should 200 on valid cookie within scope', function (done) {
    request(express()
      .use(express.cookieParser())
      .get('/', validate({
        param: {
          scope: 'cookies',
          presence: true
        }
      }), assertRequest('param', 'thing'), send200))
      .get('/')
      .set('Cookie', 'param=thing')
      .expect(200, done);
  });
  
  it('should 400 on invalid body param within scope', function (done) {
    request(express()
      .use(express.bodyParser())
      .post('/', validate({
        param: {
          scope: 'body',
          presence: true
        }
      }), send200))
      .post('/')
      .send({})
      .expect(400, done);
  });
  
  it('should 200 on valid body param within scope', function (done) {
    request(express()
      .use(express.bodyParser())
      .post('/', validate({
        param: {
          scope: 'body',
          presence: true
        }
      }), assertRequest('param', 'thing'), send200))
      .post('/')
      .send({
        param: 'thing'
      })
      .expect(200, done);
  });
  
  it('should 400 on invalid param in multiple scopes', function (done) {
    request(express()
      .use(express.bodyParser())
      .use(express.cookieParser())
      .get('/:param?', validate({
        param: {
          scope: ['route', 'query', 'body', 'cookies'],
          presence: true
        }
      }), send200))
      .get('/')
      .expect(400, done);
  });
  
  it('should 200 on valid route param in multiple scopes', function (done) {
    request(express()
      .use(express.bodyParser())
      .use(express.cookieParser())
      .get('/:param?', validate({
        param: {
          scope: ['route', 'query', 'body', 'cookies'],
          presence: true
        }
      }), assertRequest('param', 'thing'), send200))
      .get('/thing')
      .expect(200, done);
  });
  
  it('should 200 on valid query param in multiple scopes', function (done) {
    request(express()
      .use(express.bodyParser())
      .use(express.cookieParser())
      .get('/', validate({
        param: {
          scope: ['route', 'query', 'body', 'cookies'],
          presence: true
        }
      }), assertRequest('param', 'thing'), send200))
      .get('/?param=thing')
      .expect(200, done);
  });
  
  it('should 200 on valid body param in multiple scopes', function (done) {
    request(express()
      .use(express.bodyParser())
      .use(express.cookieParser())
      .post('/', validate({
        param: {
          scope: ['route', 'query', 'body', 'cookies'],
          presence: true
        }
      }), assertRequest('param', 'thing'), send200))
      .post('/')
      .send({
        param: 'thing'
      })
      .expect(200, done);
  });
  
  it('should 200 on valid cookie param in multiple scopes', function (done) {
    request(express()
      .use(express.bodyParser())
      .use(express.cookieParser())
      .get('/', validate({
        param: {
          scope: ['route', 'query', 'body', 'cookies'],
          presence: true
        }
      }), assertRequest('param', 'thing'), send200))
      .get('/')
      .set('Cookie', 'param=thing')
      .expect(200, done);
  });
});


describe('additional tests', function () {
  // these depend on behaviour defind in previous tests
  
  it('should accept functions in config object', function (done) {
    request(express()
      .get('/', validate({
        param: {
          scope: 'route',
          alwaysFail: function () {
            return true;
          }
        }
      }), send200))
      .get('/')
      .expect(400, done);
  });
  
  it('should 500 when bodyParser is omitted', function (done) {
    request(express()
      .post('/', validate({
        param: {
          scope: 'body',
          presence: true
        }
      }), send200))
      .post('/')
      .send({
        param: 'thing'
      })
      .expect(500, done);
  });
  
  it('should 500 when cookieParser is omitted', function (done) {
    request(express()
      .get('/', validate({
        param: {
          scope: 'cookies',
          presence: true
        }
      }), send200))
      .get('/')
      .expect(500, done);
  });
  
});
