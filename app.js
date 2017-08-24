/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , consolidate = require('consolidate')
  , swig = require('swig')
  , app = express()
  , config = require('./config/config');

"use strict";

app.use(express.static(path.join(__dirname, "public")));

// Register our templating engine
app.engine('html', consolidate.swig);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Express middleware to populate 'req.cookies' so we can access cookies
app.use(express.cookieParser());

// Express middleware to populate 'req.body' so we can access POST variables
app.use(express.bodyParser());

app.use(express.session({secret: config.system.sessionKey}));

routes(app);

app.set('port', process.env.PORT || config.system.serverPort);
app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
