var express = require('express');
var bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
var app = express();
const algorithm = 'aes-256-cbc'; //Using AES encryption
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({limit: '25mb'}));
app.use(bodyParser.json());
// Setting for Hyperledger Fabric
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs')

const cors = require("cors");
const { json } = require('body-parser');
const querystring = require("querystring");
const { Curl } = require("node-libcurl");

var registerUser = require('./registerUser.js');
var stringSimilarity = require("string-similarity");
const e = require('express');

//const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
//      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

const whitelist = ["http://localhost:3000","http://localhost:3001"]
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
}


//Encrypting text
function encrypt(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
 }
 
 // Decrypting text
 function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
 }

app.use(cors(corsOptions))


app.get('/api/roles-list', async function (req, res) {
    try {
       

        let rawdata_c = fs.readFileSync('ECRoles.json');
        let role_list = JSON.parse(rawdata_c);

      

        res.status(200).json({ response: role_list});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});

app.get('/api/all-data', async function (req, res) {
    try {
       

        let statesDoc = fs.readFileSync('states.json');
        let states_list = JSON.parse(statesDoc);

        let rawdata_c = fs.readFileSync('cities.json');
        let city_list = JSON.parse(rawdata_c);

        let districtFile = fs.readFileSync('district.json');
        let district_list = JSON.parse(districtFile);

      
        var allData = [
            {'states':states_list},
            {'cities':city_list},
            {'district':district_list},
        ]

        res.status(200).json({ response: allData});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});

app.get('/api/users', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('queryAllData');
        // console.log(JSON.parse(result)[0]["Record"]);
        // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        let aaryData = JSON.parse(result.toString());


        var USERDATA = aaryData.filter(function (data) {

            return data.Key.startsWith("USER");
        });

        // var Election = aaryData.filter(function (data) {

        //     return data.Key.startsWith("EL");
        // });

        // var VOTE = aaryData.filter(function (data) {

        //     return data.Key.startsWith("VOTE");
        // });
        // var VoteCasted = VOTE.filter(function (data) {

        //     return data.Record.isVoted == 'true';
        // });


        // var allStats = [
        //     {'registeredVoters':VOTE.length},
        //     {'voteCasted':VoteCasted.length},
        //     {'registeredCandidates':CANDIDATE.length},
        //     {'registeredElections':Election.length},
        // ]


        res.status(200).json({ response: USERDATA});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});

app.post('/api/registerUser/', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        console.log(req.body);

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')

      

        await contract.submitTransaction('createUserObj', req.body.id, req.body.name, req.body.email,  req.body.cnic , req.body.city , req.body.state , req.body.country, req.body.phone , req.body.role, req.body.password,  req.body.created_at);
        // await contract.submitTransaction('createVoterObj', 2,'Asher',false);
        console.log('Transaction has been submitted');
        res.send('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})

app.post('/api/webportal-auth', async function (req, res) {

    try {

        var userEmail = req.body.email;
        var password = req.body.password;
        let flag = 1;

        if (userEmail && password) {

            const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);

            // Check to see if we've already enrolled the user.
            const identity = await wallet.get('appUser');
            if (!identity) {
                console.log('An identity for the user "appUser" does not exist in the wallet');
                console.log('Run the registerUser.js application before retrying');
                return;
            }
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('fabcar');

            // Evaluate the specified transaction.
            // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
            // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
            const result = await contract.evaluateTransaction('queryAllData');
            // console.log(JSON.parse(result)[0]["Record"]);
            // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            let aaryData = JSON.parse(result.toString());


            var UsersData = aaryData.filter(function (data) {

                return data.Key.startsWith("ECPANEL");
            });


            var responseData = UsersData.filter(function (data) {

                return data.Record.email == userEmail && data.Record.password ==  password;
            });

            // console.log('UsersData', UsersData);
            // console.log('responseData', responseData);

            if (responseData != '') {

              
                const user = responseData[0].Record;
                delete user.password;
                delete user.docType;
                delete user.created_at;

                console.log("success");

                res.statusMessage = "Success";
                res.status(200).json({ response: user });
                res.end();

            } else {
                let r = "Incorrect username!";
                flag = 0;
                console.log("Credentials not verified!");
                // response.render(__dirname + "/public/EC-dashboard/ec-login.html", {_:r});
                // response.end();
                res.statusMessage = "Credentials not verified!";
                res.status(200).json({ error: 'Credentials not verified!' });
                res.end();
            }
        } else {
            let r = "Please enter your details!";
            flag = 0;
            console.log("Credentials not verified!");
            // response.render(__dirname + "/public/EC-dashboard/ec-login.html", {_:r});
            // response.end();
        }
        if (flag == 1) {
            console.log("Credentials verified, loggin the EC in!");
            // response.redirect('/EC-dashboard/ec-dashboard.html');
        }




        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }

    // try {

    //     var userEmail = req.body.email;
    //     var password = req.body.password;

    //     // console.log(userEmail)
    //     // console.log(password)


       
 
    //     if (userEmail == 'admin@email.com' && password == 12345) {

    //         req.body.password = '5385vnt4t97p074bv70'
    //         req.body.status = 'Success'


              
    //         res.status(200).json({ response: req.body });
    //         res.end();

    //     } 
    //     else
    //     {              
              
    //             res.status(200).json({ error: 'Credentials not verified!' });
    //             res.end();
    //     }

    // } catch (error) {
    //     console.error(`Failed to evaluate transaction: ${error}`);
    //     res.status(500).json({ error: error });
    //     process.exit(1);
    // }
});
app.post('/api/signin', async function (req, res) {

    try {

        var userEmail = req.body.email;
        var password = req.body.password;
        let flag = 1;

        if (userEmail && password) {

            const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);

            // Check to see if we've already enrolled the user.
            const identity = await wallet.get('appUser');
            if (!identity) {
                console.log('An identity for the user "appUser" does not exist in the wallet');
                console.log('Run the registerUser.js application before retrying');
                return;
            }
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('fabcar');

            // Evaluate the specified transaction.
            // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
            // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
            const result = await contract.evaluateTransaction('queryAllData');
            // console.log(JSON.parse(result)[0]["Record"]);
            // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            let aaryData = JSON.parse(result.toString());


            var UsersData = aaryData.filter(function (data) {

                return data.Key.startsWith("USER");
            });


            var responseData = UsersData.filter(function (data) {

                return data.Record.email == userEmail && data.Record.password ==  password;
            });

            // console.log('UsersData', UsersData);
            // console.log('responseData', responseData);

            if (responseData != '') {

              
                const user = responseData[0].Record;
                delete user.password;
                delete user.docType;
                delete user.created_at;

                console.log("success");

                res.statusMessage = "Success";
                res.status(200).json({ response: user });
                res.end();

            } else {
                let r = "Incorrect username!";
                flag = 0;
                console.log("Credentials not verified!");
                // response.render(__dirname + "/public/EC-dashboard/ec-login.html", {_:r});
                // response.end();
                res.statusMessage = "Credentials not verified!";
                res.status(200).json({ error: 'Credentials not verified!' });
                res.end();
            }
        } else {
            let r = "Please enter your details!";
            flag = 0;
            console.log("Credentials not verified!");
            // response.render(__dirname + "/public/EC-dashboard/ec-login.html", {_:r});
            // response.end();
        }
        if (flag == 1) {
            console.log("Credentials verified, loggin the EC in!");
            // response.redirect('/EC-dashboard/ec-dashboard.html');
        }




        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }

    // try {

    //     var userEmail = req.body.email;
    //     var password = req.body.password;

    //     // console.log(userEmail)
    //     // console.log(password)


       
 
    //     if (userEmail == 'admin@email.com' && password == 12345) {

    //         req.body.password = '5385vnt4t97p074bv70'
    //         req.body.status = 'Success'


              
    //         res.status(200).json({ response: req.body });
    //         res.end();

    //     } 
    //     else
    //     {              
              
    //             res.status(200).json({ error: 'Credentials not verified!' });
    //             res.end();
    //     }

    // } catch (error) {
    //     console.error(`Failed to evaluate transaction: ${error}`);
    //     res.status(500).json({ error: error });
    //     process.exit(1);
    // }
});

app.post('/api/addLocations/', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        console.log(req.body);

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')

      
        await contract.submitTransaction('addLocations', req.body.id, req.body.lat, req.body.long,  req.body.icon , req.body.address , req.body.user_id  , req.body.status, req.body.last_update_id,  req.body.created_at);
        // await contract.submitTransaction('createVoterObj', 2,'Asher',false);
        console.log('Transaction has been submitted');
        res.send('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})

app.post('/api/main-validator/', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        console.log(req.body);

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')

      
        await contract.submitTransaction('locationHide', req.body.location_id, req.body.user_id, req.body.status, );
        // await contract.submitTransaction('createVoterObj', 2,'Asher',false);
        console.log('Transaction has been submitted');
        res.send('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})

app.get('/api/locations', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('queryAllData');
        // console.log(JSON.parse(result)[0]["Record"]);
        // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        let aaryData = JSON.parse(result.toString());


        var USERDATA = aaryData.filter(function (data) {

            return data.Key.startsWith("LOCATION");
        });

        // var Election = aaryData.filter(function (data) {

        //     return data.Key.startsWith("EL");
        // });

        // var VOTE = aaryData.filter(function (data) {

        //     return data.Key.startsWith("VOTE");
        // });
        // var VoteCasted = VOTE.filter(function (data) {

        //     return data.Record.isVoted == 'true';
        // });


        // var allStats = [
        //     {'registeredVoters':VOTE.length},
        //     {'voteCasted':VoteCasted.length},
        //     {'registeredCandidates':CANDIDATE.length},
        //     {'registeredElections':Election.length},
        // ]


        res.status(200).json({ response: USERDATA});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});

app.post('/api/claimLocations/', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        console.log(req.body);

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')

      
        await contract.submitTransaction('locationClaim', req.body.id, req.body.images_, req.body.description,  req.body.location_id , req.body.user_id  , req.body.status,  req.body.created_at);
        // await contract.submitTransaction('createVoterObj', 2,'Asher',false);
        console.log('Transaction has been submitted');
        res.send('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})


app.get('/api/claims', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('queryAllData');
        // console.log(JSON.parse(result)[0]["Record"]);
        // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        let aaryData = JSON.parse(result.toString());


        var USERDATA = aaryData.filter(function (data) {

            return data.Key.startsWith("ClaimLoc");
        });

        // var Election = aaryData.filter(function (data) {

        //     return data.Key.startsWith("EL");
        // });

        // var VOTE = aaryData.filter(function (data) {

        //     return data.Key.startsWith("VOTE");
        // });
        // var VoteCasted = VOTE.filter(function (data) {

        //     return data.Record.isVoted == 'true';
        // });


        // var allStats = [
        //     {'registeredVoters':VOTE.length},
        //     {'voteCasted':VoteCasted.length},
        //     {'registeredCandidates':CANDIDATE.length},
        //     {'registeredElections':Election.length},
        // ]


        res.status(200).json({ response: USERDATA});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});


app.post('/api/addVisit/', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        console.log(req.body);

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')

       
      
        await contract.submitTransaction('visitsLocations', req.body.id, req.body.ClaimID, req.body.Comments,  req.body.VisitDate , req.body.user_id , req.body.images , req.body.status,  req.body.created_at);
        // await contract.submitTransaction('createVoterObj', 2,'Asher',false);
        console.log('Transaction has been submitted');
        res.send('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})


app.get('/api/visit', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('queryAllData');
        // console.log(JSON.parse(result)[0]["Record"]);
        // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        let aaryData = JSON.parse(result.toString());


        var USERDATA = aaryData.filter(function (data) {

            return data.Key.startsWith("VISIT");
        });

        // var Election = aaryData.filter(function (data) {

        //     return data.Key.startsWith("EL");
        // });

        // var VOTE = aaryData.filter(function (data) {

        //     return data.Key.startsWith("VOTE");
        // });
        // var VoteCasted = VOTE.filter(function (data) {

        //     return data.Record.isVoted == 'true';
        // });


        // var allStats = [
        //     {'registeredVoters':VOTE.length},
        //     {'voteCasted':VoteCasted.length},
        //     {'registeredCandidates':CANDIDATE.length},
        //     {'registeredElections':Election.length},
        // ]


        res.status(200).json({ response: USERDATA});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});

app.put('/api/changeowner/:car_index', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');
        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('changeCarOwner', req.params.car_index, req.body.owner);
        console.log('Transaction has been submitted');
        res.send('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})


app.get('/api/reset-all-data', async function (req, res) {
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction('queryAllVoter');

        
        // console.log(JSON.parse(result)[0]["Record"]);
        // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        let aaryData = JSON.parse(result.toString());
        

        // var CANDIDATE = aaryData.filter(function (data) {

        //     return data.Key.startsWith("CANDIDATE");
        // });

        // var Election = aaryData.filter(function (data) {
            
            //     return data.Key.startsWith("EL");
        // });
        
        var VOTE =  aaryData.filter(function (data) {

            return data.Key.startsWith("VOTE");
        });


         VOTE.filter( async function (data) {

            await  contract.submitTransaction('resetElection',data.Key);
            console.log('3333');
        });
        
       
        res.status(200).json({ response: VOTE});

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});


// app.get('/api/query/:car_index', async function (req, res) {
//     try {
// const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
//         const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
// // Create a new file system based wallet for managing identities.
//         const walletPath = path.join(process.cwd(), 'wallet');
//         const wallet = await Wallets.newFileSystemWallet(walletPath);
//         console.log(`Wallet path: ${walletPath}`);

//         // Check to see if we've already enrolled the user.
//         const identity = await wallet.get('appUser');
//         if (!identity) {
//             console.log('An identity for the user "appUser" does not exist in the wallet');
//             console.log('Run the registerUser.js application before retrying');
//             return;
//         }
//   // Create a new gateway for connecting to our peer node.
//         const gateway = new Gateway();
//         await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

//         // Get the network (channel) our contract is deployed to.
//         const network = await gateway.getNetwork('mychannel');

//         // Get the contract from the network.
//         const contract = network.getContract('fabcar');
// // Evaluate the specified transaction.
//         // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
//         // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
//         const result = await contract.evaluateTransaction('queryCar', req.params.car_index);
//         console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
//         res.status(200).json({response: result.toString()});
// } catch (error) {
//         console.error(`Failed to evaluate transaction: ${error}`);
//         res.status(500).json({error: error});
//         process.exit(1);
//     }
// });


  


app.listen(8080);