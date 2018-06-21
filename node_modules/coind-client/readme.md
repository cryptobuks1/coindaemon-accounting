
## coind-client

Client for crypto-currency bitcoind-based daemons.

Code adapted from https://github.com/freewil/node-bitcoin to adhere to the Node.js/JavaScript callback/control-flow conventions/style, and to provide for faster/wrapper-less initialization.

### Usage

```js

var coind = require('coind-client');

var client = new coind.Client({
  host: 'localhost',
  port: 8332,
  user: 'username',
  pass: 'password'
});

// single request use:

client.cmd('getbalance', '*', 6, function(err, balance) {
  if(err)
    // handle error; e.g. with laeh2
  console.log('Balance: %d', balance);
});

// batch request use:

var batch = [];
for (var i = 0; i < 10; ++i) {
  batch.push({
    method: 'getnewaddress',
    params: ['myaccount']
  });
}

client.cmd(batch, function(errors, addresses) {
  if(errors)
    // handle errors; e.g. with laeh2
  for(var i = 0; i < addresses.length; i++)
    console.log('Address: %s', addresses[i]);
});

```

### Daemon API reference / Available commands

https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_Calls_list


### How to install litecoind (or equivalent daemon) (taken from [cryptoengine](https://github.com/Unitech/cryptoengine))

First, the basic install (for ubuntu) :

```bash
$ sudo apt-get update
$ sudo apt-get install build-essential libssl-dev libdb5.1-dev libdb5.1++-dev libboost-all-dev git
$ git clone https://github.com/litecoin-project/litecoin
$ cd litecoin/src
$ make -j4 -f makefile.unix USE_UPNP=
$ ne ~/.litecoind/litecoin.conf # cp what litcoind say
Then to make litecoind synchronized faster with the network (minutes instead of days) :

$ sudo apt-get install transmission-cli
$ mkdir dat
$ transmission-cli http://www.lurkmore.com/litecoin-bootstrap/litecoin-bootstrap.torrent -w dat
$ xz -d litecoin-bootstrap/bootstrap.dat.xz
$ cp bootstrap.dat ~/.litecoin/
```

### How to test locally using Bitcoin-Qt, Litecoin-Qt, etc. (Mac example)

```bash
/Applications/Bitcoin-Qt.app/Contents/MacOS/Bitcoin-Qt \
    -server -rpcuser=someusername -rpcpassword=somepasword -rpcport=1234
```

### TODO

More tests!

### License

MIT
