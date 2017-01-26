# Botkit Middleware to populate Facebook Messenger user info to a Botkit message
## Installation
Add github repo url to package.json

Example:
```js

var fbuser = require('botkit-middleware-fbuser')({
    accessToken:'<fb_access_token>',
    fields: ['first_name', 'last_name', 'locale', 'profile_pic','timezone','gender','is_payment_enabled'],
    logLevel:'error',
    storage: '<Botkit storage object>'
});


controller.middleware.receive.use(fbuser.receive)
```
A message object will have an additional field `user_profile` with the fields requested to Facebook API.

##Author

**Nathan Zylbersztejn**

Github: [@znat](https://github.com/snat)
