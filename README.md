#Express validate.js [![NPM version](https://badge.fury.io/js/express-validate.js.png)](http://badge.fury.io/js/express-validate.js) [![Build Status](https://travis-ci.org/Janpot/express-validate.png?branch=master)](https://travis-ci.org/Janpot/express-validate) [![Coverage Status](https://coveralls.io/repos/Janpot/express-validate/badge.png?branch=master)](https://coveralls.io/r/Janpot/express-validate?branch=master)

Middleware wrapper for validate.js validation framework

##Installation

`$ npm install --save express-validate.js`

##Example

```js
var validate = require('express-validate.js'),
    express  = require('express');

express()
  .get('/user/:userId', validate({
    userId: {
      scope: 'route',
      presence: true,
      format: {
        pattern: /\d{5}/,
        message: 'must be a five digit number'
      }
    }
  }), function (req, res) {
    res.send(200, 'User: ' + req.valid.userId);
  })
  .listen(3000);
```

##How it works

This middleware is configured the same way as [validate.js](http://validatejs.org/#constraints) with an additional scope constraint. This can either be a string or an array containing one of following values:

- `route`: Check for values in the route parameters of the request
- `body`: Check for parameters in the request body, requires `express.bodyParser`
- `query`: Check for parameters in the querystring of the request

If scope is an array, the first scope that has a corresponding value wins. Scope must always be defined.

In case of invalid values, the validator responds with a 400 response containing the result of the validation. Otherwise the validated parameters are attached to the request in the `valid` object.

In the same way as can be done to [validate.js](http://validatejs.org/#custom-validator) custom validators can be attached to `validate.validators`

##License

MIT
