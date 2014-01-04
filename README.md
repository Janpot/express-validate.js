#Express validate.js [![Build Status](https://travis-ci.org/Janpot/express-validate.js.png?branch=master)](https://travis-ci.org/Janpot/express-validate.js) [![Coverage Status](https://coveralls.io/repos/Janpot/express-validate.js/badge.png?branch=master)](https://coveralls.io/r/Janpot/express-validate.js?branch=master)

Middleware wrapper for [validate.js](http://validatejs.org) validation framework

##Installation

`$ npm install express-validate.js`

##Example

```js
var validate = require('express-validate.js'),
    express  = require('express');

express()
  .get('/user/:userId/:page?', validate({
    userId: {
      scope: 'route',
      presence: true,
      format: {
        pattern: /\d{5}/,
        message: 'must be a five digit number'
      }
    },
    page: {
      scope: ['route', 'query'],
      numericality: {
        onlyInteger: true,
        greaterThanOrEqualTo: 0,
      }
    }
  }), function (req, res) {
    var userId = req.valid.userId,
        page   = req.valid.page || 0;
    res.send(200, 'User ' + userId + ' is on page ' + page);
  })
  .listen(3000);
```

Following requests validate:

    curl http://localhost:3000/user/12345
    => User 12345 is on page 0

    curl http://localhost:3000/user/12345?page=1
    => User 12345 is on page 1

    curl http://localhost:3000/user/12345/14
    => User 12345 is on page 14

Following requests are rejected:

    curl http://localhost:3000/user/1234
    => {
      "userId": [
        "User id must be a five digit number"
      ]
    }

    curl http://localhost:3000/user/abcde
    => {
      "userId": [
        "User id must be a five digit number"
      ]
    }

    curl http://localhost:3000/user/12345/-1
    => {
      "page": [
        "Page must be greater than or equal to 0"
      ]
    }

##How it works

This middleware is configured the same way as [validate.js](http://validatejs.org/#constraints) with an additional scope constraint. This can either be a string or an array containing one of following values:

- `route`: Check for values in the route parameters of the request
- `body`: Check for parameters in the request body, requires `express.bodyParser`
- `query`: Check for parameters in the querystring of the request
- `cookies`: Check for parameters in the cookies, requires `cookieParser`

If scope is an array, the first scope that has a corresponding value wins. Scope must always be defined.

In case of invalid values, the validator responds with a 400 response containing the result of the validation. Otherwise the validated parameters are attached to the request in the `valid` object.

In the same way as can be done to [validate.js](http://validatejs.org/#custom-validator), custom validators can be attached to `validate.validators`

##License

MIT
