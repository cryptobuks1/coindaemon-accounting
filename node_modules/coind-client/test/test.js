
var laeh2 = require('laeh2');
var _x = laeh2._x;
var _e = laeh2._e;
var utilz = require('utilz');
var async = require('async-mini');
var cb = utilz.cb;

// /Applications/Bitcoin-Qt.app/Contents/MacOS/Bitcoin-Qt -testnet -server -rpcuser=username -rpcpassword=password -rpcport=8332 -debug -printtoconsole

// curl --data-binary '[{"jsonrpc":"2.0","id":"1390766579981-0","method":"getnewaddress","params":[]},{"jsonrpc":"2.0","id":"1390766579981-1","method":"getnewaddress","params":[]}]'  -H 'content-type: text/plain;' -u "username:password" http://127.0.0.1:8332/

var coind = require('../index');

var client = new coind.Client({
  host: 'localhost',
  port: 8332,
  user: 'username',
  pass: 'password'
});

var cmds = [
    _x(null, false, function(cb) {

        client.cmd('getbalance', '*', 6, _x(cb, true, function(err, balance) {
          console.log('Balance: %d', balance);
          cb();
        }));
    }),
    _x(null, false, function(cb) {

        client.cmd('listsinceblock', _x(cb, true, function(err, res) {
          console.log('response: %s', JSON.stringify(res, null, '  '));
          cb();
        }));
    }),
    _x(null, false, function(cb) {

        var batch = [];
        for (var i = 0; i < 10; ++i) {
          batch.push({
            method: 'getnewaddress',
            params: []
          });
        }

        client.cmd(batch, _x(cb, true, function(err, addresses) {
          for(var i = 0; i < addresses.length; i++)
            console.log('Address: %s', addresses[i]);
          cb();
        }));
    })
];

async.series(cmds, _x(cb, true, function(err, res) {
    cb(null, 'success');
}));
