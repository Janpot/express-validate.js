'use strict';

var validate = require('validate.js'),
    util     = require('util');

function createMiddleware(constraints, options) {
  
  var VALID_SCOPES = ['route', 'query', 'body'];
  
  var scopes     = {},
      validators = {};
  
  Object.keys(constraints).forEach(function (parameter) {
    var validator = constraints[parameter];
    
    if (!validator.scope) {
      
      var errMsg = util.format('Scope undefined for "%s"', parameter);
      throw new Error(errMsg);
      
    } else {
    
      var isSingleScope = typeof validator.scope === 'string',
          scope = isSingleScope ? [validator.scope] : validator.scope;
      
      scope.forEach(function (scopeName) {
        if (VALID_SCOPES.indexOf(scopeName) < 0) {
          var errMsg = util.format('Invalid scope "%s"', scopeName);
          throw new Error(errMsg);
        }
      });
      
      scopes[parameter] = scope;
    
    }
    
    // build validator objects without the scope property
    var validatorClone = {};
    Object.keys(validator).filter(function (key) {
      return key !== 'scope';
    }).forEach(function (key) {
      validatorClone[key] = validator[key];
    });
    
    validators[parameter] = validatorClone;
    
  });
  
  // test on empty object for exceptions
  validate({}, validators);
  
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
        }
        
        if (validated[paramName] !== undefined) {
          break;
        }
      }
    });

    var result = validate(validated, validators, options);
    
    if (result) {
      res.json(400, result);
    } else {
      req.valid = validated;
      next();
    }
  };
}

// expose for custom validators
createMiddleware.validators = validate.validators;

module.exports = createMiddleware;
