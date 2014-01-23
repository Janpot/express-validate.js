'use strict';

require('q');

var validate = require('validate.js'),
    util     = require('util');


function alwaysPass() {
  return null;
}

// add a dummy scope validator
validate.validators.scope = validate.validators.scope || alwaysPass;

function createMiddleware(constraints, options) {
  
  var VALID_SCOPES  = ['route', 'query', 'body', 'cookies'],
      DEFAULT_SCOPE = ['route'];
  
  var scopes = {};
  
  Object.keys(constraints).forEach(function (parameter) {
    var validator = constraints[parameter];
    
    if (!validator.scope) {
      
      scopes[parameter] = DEFAULT_SCOPE;
      
    } else {
    
      var isSingleScope = typeof validator.scope === 'string',
          scope = isSingleScope ? [validator.scope] : validator.scope;
      
      var normalized = scope.map(function (scopeName) {
        return scopeName.toLowerCase();
      });
      
      normalized.forEach(function (scopeName) {
        if (VALID_SCOPES.indexOf(scopeName) < 0) {
          var errMsg = util.format('Invalid scope "%s"', scopeName);
          throw new Error(errMsg);
        }
      });
      
      scopes[parameter] = normalized;
    }
    
  });
  
  // test on empty object for exceptions
  validate({}, constraints);
  
  // create actual middleware
  return function expressValidate(req, res, next) {
    var validated = {};
    
    // collect values
    Object.keys(scopes).forEach(function (paramName) {
      var paramScopes = scopes[paramName];
      
      for (var i = 0; i < paramScopes.length; i += 1) {
        switch (paramScopes[i]) {
          case 'route':
            var value = req.route.params[paramName];
            validated[paramName] = value;
            break;
          case 'query':
            validated[paramName] = req.query[paramName];
            break;
          case 'body':
            if (req.body) {
              validated[paramName] = req.body[paramName];
            } else {
              throw new Error('Express bodyParser is required');
            }
            break;
          case 'cookies':
            if (req.cookies) {
              validated[paramName] = req.cookies[paramName];
            } else {
              throw new Error('Express cookieParser is required');
            }
            break;
        }
        
        if (validated[paramName] !== undefined) {
          break;
        }
      }
    });

    validate.async(validated, constraints, options)
      .then(function success() {
        req.valid = validated;
        next();
      }, function error(errors) {
        var result = errors;
        if (createMiddleware.customResponse) {
          result = createMiddleware.customResponse(errors);
        }
        res.send(400, result);
      });
  };
}

// expose for custom validators
createMiddleware.validators = validate.validators;

module.exports = createMiddleware;
