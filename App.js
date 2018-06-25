// Scott lindh
// Account managment for coin daemons without inbuilt acocunting
// info@merkle.group
// http://merkle.group
//
//

var coind = require('coind-client');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://wallet:wall52r@ds117681.mlab.com:17681/btcp-accouting';
const dbName = 'btcp-accouting';
var dbCollection = "accounts";

var coindaimon = new coind.Client({
  host: '77.87.77.148',
  port: 3333,
  user: 'xxxx1234',
  pass: '1234xxx'
});

/*
coindaimon.cmd('getbalance',"", function(err, info) {
    if(err){
        console.log(err);
    }else{
        console.log(info);
    }   
  });
*/

/*
createAccount("test", function(d){
    if(d.success){
        console.log(d.data);
    }else{
        console.log(d.error);
    }
 });
*/

function createAccount(user, callback){
    //check if user exists
    MongoClient.connect(url, function(err, client) {        
        if(err){
            return callback({success:false, error:err})
        }else{
                //console.log("Connected successfully to DB..");
                // Get the documents collection
                const db = client.db(dbName);
                const collection = db.collection(dbCollection);
                collection.find({'user':user}).toArray(function(err, docs) {
                  //documents found
                  if(err){
                    //console.log(err);
                    return callback({success:false, error:err});
                  }else{

                        try{
                            //console.log(docs);
                            //console.log("trying to find account....");

                            docs.forEach(element => {
                                if(element.user == user){
                                    //console.log("user found");  
                                    return callback({success:true, data:element});                                  
                                }else{
                                    //console.log("nope");
                                }
                            });
                            //console.log("No account found....");
                            throw Error('no account');
                        }catch(x){
                            //console.log(x);
                            //console.log("no user found");
                            //console.log("creating new address, for new user");
                            coindaimon.cmd('getnewaddress', "", function(err, address) {
                           
                            if(err){
                                //console.log(err)
                                if(err.indexOf("403") !== -1){
                                    return callback({success:false, error:"403 Forbidden"});
                                }
                                return callback({success:false, error:err});
                            }else{     
                                 const collection = db.collection(dbCollection);
                                 // Insert some documents
                                 collection.insertMany([
                                      {'user' : user, 'address':address, 'spent':0}
                                 ], function(err, result) {
                                      //console.log("Created new account");
                                      client.close();
                                      if(err){
                                        return callback({success:false, err:err});
                                      }
                                      return callback({success:true, data:result});
                                  });
                                }
                            //

                        });                                            
                      }
                  }
                });
                //no documents found
                //console.log("");                
              }    
      });    
}

/*
depositAddress("scott", function(d){
    if(d.success){
      console.log(d.address);
    }else{
      console.log(d.error);
    }    
});
*/
function depositAddress(user, callback){
    createAccount(user, function(d){
        if(d.success){
          return callback({success:true, address:d.data.address});
        }else{
          return callback({success:false, data:d.error});
        }        
    });
}

/*
send("scott", "b1EaUGN5vcBzWmVLo35pNypP8bYWdZCXk1R", 0.1, function(d){
    if(d.success){
      console.log(d.tx);
    }else{
      console.log(d.error);
    }    
});
*/
function send(user, address, amount, callback){ //send/withdraw
    //check balance first
    balance(user, function(d){
        if(d.success){
          console.log(d.balance);
          if(d.balance > amount){
            //user has enough to send
            //send
            coindaimon.cmd('sendtoaddress', address, amount, function(err, tx) {
                if(err){
                    //console.log(err);
                    return callback({success:false, error:err});
                }else{
                    //console.log(info);

                    //Lets Mark account spent 
                    addSpent(user, amount, function(d){
                        if(d.success){
                          //console.log(d.message);
                          //SUCCESS RETURN TRANSACTION
                          return callback({success:true, tx:tx});
                        }else{
                          console.log(d.error);
                          return callback({success:false, error:d.error});

                        }    
                    });


                }   
              });
          }else{
            //user don't have enough coins to send
            return callback({success:false, error:"Not enough balance to send."});
          }

        }else{
          console.log(d.error);
        }    
    });
}


balance("test", function(d){
    if(d.success){
      console.log(d.balance);
    }else{
      console.log(d.error);
    }    
});

function balance(user, callback){
    createAccount(user, function(d){
        if(d.success){
          // got spent in d.data.spent, lets get addressbalance now
          coindaimon.cmd('getreceivedbyaddress', d.data.address, 1, function(err, bal) {
            if(err){
                //console.log(err);
                return callback({success:false, error:err});
            }else{
                //console.log(info);
                var finalBalance = bal - d.data.spent;
                return callback({success:true, balance:finalBalance});
            }   
          });

          //listunspent
          //sendtoaddress
          //getbalance
          //getreceivedbyaddress
          
        }else{
          return callback({success:false, data:d.error});
        }        
    });
}

/*
getSpent("scott", function(d){
    if(d.success){
      console.log(d.spent);
    }else{
      console.log(d.error);
    }    
});
*/
function getSpent(user, callback){
    createAccount(user, function(d){
        if(d.success){
          return callback({success:true, spent:d.data.spent});
        }else{
          return callback({success:false, error:d.error});
        }
        
    });
}

/*
addSpent("scott", 0.1, function(d){
    if(d.success){
      console.log(d.message);
    }else{
      console.log(d.error);
    }    
});
*/
function addSpent(user, amount, callback){
    getSpent("scott", function(d){
        if(d.success){
          var originalSpent = d.spent;
          MongoClient.connect(url, function(err, client) { 
            const db = client.db(dbName);
            const collection = db.collection(dbCollection);
            // Update document where user is user, set spent equal to amount

            var newSpent = parseFloat(originalSpent) + parseFloat(amount);

            collection.updateOne({ user : user }
            , { $set: { spent : parseFloat(newSpent).toFixed(5) } }, function(err, result) {
                //console.log("Updated the document ...");
                if(err){
                    return callback({success:false, error:err});
                }else{
                    return callback({success:true, message:"Spent has been updated"});
                }                
                //callback(result);
            }); 
            client.close();   
        });
        }else{
          console.log(d.error);
        }    
    });
}

  //deposit
  //withdraw


