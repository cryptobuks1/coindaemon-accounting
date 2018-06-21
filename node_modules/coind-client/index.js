
// most of the code taken and adapted from https://github.com/freewil/node-bitcoin
// changes performed: code updated to follow the Node.js/JavaScript callback/control-flow conventions/style

var laeh2 = require('laeh2');
var _x = laeh2._x;
var _e = laeh2._e;
// var request = require('request');
var http = require('http');
var https = require('https');

var Client = function(opts) {
  this.opts = opts || {};
  this.http = this.opts.ssl ? https : http;
};

Client.prototype.cmd = function() { // method, params, callback

  if(arguments.length < 2)
    _e('Invalid parameters; expected at least "method/batch" and "callback".');

  var method = arguments[0];
  var last = arguments.length - 1;
  var params = [];
  for(var i = 1; i < last; i++)
    params.push(arguments[i]);

  var callback = arguments[last];
  var returned;

  function cb() {
    // only return once
    if(returned || !callback)
      return;
    returned = true;
    callback.apply(this, Array.prototype.slice.call(arguments, 0));
  };

  var time = Date.now();
  var requestJSON;
  var multi;

  if (Array.isArray(method)) {
    // multiple rpc batch call
    multi = true;
    requestJSON = [];
    method.forEach(function(batchCall, i) {
      requestJSON.push({
        jsonrpc: '2.0',
        id: time + '-' + i,
        method: batchCall.method,
        params: batchCall.params
      });
    });
  } else {
    // single rpc call
    requestJSON = {
      jsonrpc: '1.0',
      id: time,
      method: method,
      params: params
    };
  }

  // First we encode the request into JSON
  var requestJSON = JSON.stringify(requestJSON);

  // prepare request options
  var requestOptions = {
    host: this.opts.host || 'localhost',
    port: this.opts.port || 8332,
    method: 'POST',
    path: this.opts.path || '/',
    headers: {
      'Content-Type': 'text/plain',
      'Host': this.opts.host || 'localhost',
      'Content-Length': requestJSON.length
    },
    agent: this.opts.agent || false,
    rejectUnauthorized: this.opts.ssl && this.opts.sslStrict !== false
  };

  if (this.opts.ssl && this.opts.sslCa) {
    requestOptions.ca = this.opts.sslCa;
  }

  // use HTTP auth if user and password set
  if (this.opts.user && this.opts.pass) {
    requestOptions.auth = this.opts.user + ':' + this.opts.pass;
  }

  // Now we'll make a request to the server
  var request = this.http.request(requestOptions);

  request.on('error', cb);

  request.on('response', _x(cb, false, function(response) {
    // We need to buffer the response chunks in a nonblocking way.
    var buffer = '';
    response.on('data', _x(cb, false, function(chunk) {
      buffer = buffer + chunk;
    }));
    // When all the responses are finished, we decode the JSON and
    // depending on whether it's got a result or an error, we call
    // emitSuccess or emitError on the promise.
    response.on('end', _x(cb, false, function() {

  /*var opts = {
    url: 'http://' + (this.opts.host || 'localhost') + ':' + (this.opts.port || 8332),
    auth: {
      user: 'username',
      pass: 'password',
      sendImmediately: false
    },
    headers: {
      'content-type': 'text/plain'
    }
  };

  request(opts, _x(cb, true, function(err, res, buffer) {*/
      var err;

      try {
        var decoded = JSON.parse(buffer);
      } catch (e) {
        if (response.statusCode !== 200) {
          err = new Error('Invalid params, response status code: ' + response.statusCode);
          err.code = -32602;
          return cb(err);
        } else {
          err = new Error('Problem parsing JSON response from server');
          err.code = -32603;
          return cb(err);
        }
      }

      if (!Array.isArray(decoded)) {
        decoded = [decoded];
      }

      var results = [];
      var errors = [];
      var isError = false;

      // iterate over each response, normally there will be just one
      // unless a batch rpc call response is being processed
      decoded.forEach(function(decodedResponse, i) {
        if (decodedResponse.hasOwnProperty('error') && decodedResponse.error != null) {
          var err = new Error(decodedResponse.error.message || '');
          if (decodedResponse.error.code) {
            err.code = decodedResponse.error.code;
          }
          errors.push(err);
          isError = true;
          results.push(null);
        } else if (decodedResponse.hasOwnProperty('result')) {
          errors.push(null);
          results.push(decodedResponse.result);
        } else {
          err = new Error(decodedResponse.error.message || '');
          if (decodedResponse.error.code) {
            err.code = decodedResponse.error.code;
          }
          errors.push(err);
          isError = true;
          results.push(null);
        }
      });

      // give 'em the good results too, in case they want to use them
      if(multi) {
        cb(isError ? errors : null, results);
      }
      else {
        // handle the case where we can get multi results on a singleton query
        if(errors.length > 1 || results.length > 1) {
          cb(isError ? errors : null, results);
        }
        else {
          cb(isError ? errors[0] : null, results[0]);
        }
      }
  /* })); */
    }));
  }));
  request.end(requestJSON);
};

exports.Client = Client;
