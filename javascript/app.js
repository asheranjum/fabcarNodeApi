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


app.get('/api/all-states', async function (req, res) {
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


        var CANDIDATE = aaryData.filter(function (data) {

            return data.Key.startsWith("CANDIDATE");
        });

        var Election = aaryData.filter(function (data) {

            return data.Key.startsWith("EL");
        });

        var VOTE = aaryData.filter(function (data) {

            return data.Key.startsWith("VOTE");
        });
        var VoteCasted = VOTE.filter(function (data) {

            return data.Record.isVoted == 'true';
        });


        var allStats = [
            {'registeredVoters':VOTE.length},
            {'voteCasted':VoteCasted.length},
            {'registeredCandidates':CANDIDATE.length},
            {'registeredElections':Election.length},
        ]


        res.status(200).json({ response: allStats});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});
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
        
        
        // var allStats = [
        //     // {'registeredVoters':VOTE},
        //     // {'voteCasted':VoteCasted},
        //     // {'registeredCandidates':CANDIDATE},
        //     // {'registeredElections':Election},
        // ]
        


        // const result1 = await contract.evaluateTransaction('queryAllVoter');

        
        // // console.log(JSON.parse(result)[0]["Record"]);
        // // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        // let aaryData1 = JSON.parse(result1.toString());
        

        // var VOTEData = aaryData1.filter(function (data) {

        //     return data.Key.startsWith("VOTE");
        // });
        
    
        res.status(200).json({ response: VOTE});

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});

app.get('/api/registerAdmin', async function (req, res) {
    try {
       

      let responseData =  registerUser.registerUser() 

        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});


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
            const result = await contract.evaluateTransaction('queryAllVoter');
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

app.post('/api/registerPanelUser/', async function (req, res) {
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

        // console.log(req.body);

        
        const allVoterData = await contract.evaluateTransaction('queryAllVoter');
        console.log(`Transaction has been evaluated, result is: ${allVoterData.toString()}`);

        let aaryData = JSON.parse(allVoterData.toString());


        var UserResponseData = aaryData.filter(function (data) {

            return data.Key.startsWith("ECPANEL");
        });

        
        var checkUserIFExits = UserResponseData.filter(function (data) {

            return data.Record.cnic == req.body.cnic;
        });

        var checkUserIFExitsEmail = UserResponseData.filter(function (data) {

            return data.Record.email == req.body.email;
        });

        if(checkUserIFExits.length == 0)
        { 
            if(checkUserIFExitsEmail == 0)
            {
                await contract.submitTransaction('createAdminUserObj', req.body.id, req.body.name, req.body.email , req.body.phone , req.body.cnic  ,  req.body.state , req.body.city , req.body.role , req.body.user_id , req.body.password, req.body.created_at);
                // await contract.submitTransaction('createVoterObj', 2,'Asher',false);
                console.log('Transaction has been submitted');
                res.send('Transaction has been submitted');
            }
            else
            {
                res.status(200).json('Email already exists');
            }

            
        }
        else
        {
            res.status(200).json('CNIC already exists');
        }

        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})
app.post('/api/addvoter/', async function (req, res) {
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

        // console.log(req.body);

        
        const allVoterData = await contract.evaluateTransaction('queryAllVoter');
        console.log(`Transaction has been evaluated, result is: ${allVoterData.toString()}`);

        let aaryData = JSON.parse(allVoterData.toString());


        var VoterResponseData = aaryData.filter(function (data) {

            return data.Key.startsWith("VOTE");
        });

        
        var checkVoterIFExits = VoterResponseData.filter(function (data) {

            return data.Record.cnic == req.body.cnic;
        });

        console.log('++++++++++++++++++=================');
        console.log(req.body);

        if(checkVoterIFExits.length == 0)
        { 
            await contract.submitTransaction('createVoterObj', req.body.id, req.body.name, req.body.cnic, req.body.phone, req.body.state , req.body.city , req.body.district , req.body.template1 , req.body.template2 , req.body.fingerprintMatchStatus, req.body.password, req.body.isVoted, req.body.user_id ,req.body.voted_at, req.body.created_at);
            // await contract.submitTransaction('createVoterObj', 2,'Asher',false);
            console.log('Transaction has been submitted');
            res.send('Transaction has been submitted');
            
        }
        else
        {
            res.status(200).json('CNIC already exists');
        }

        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})

app.post('/api/make-election/', async function (req, res) {
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
        let candidatesss = JSON.stringify(req.body.candidatesIDs);
        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('createElectionObj', req.body.electionID, req.body.title, req.body.startTime, req.body.endTime, req.body.isStarted , candidatesss ,req.body.created_at);
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


app.get('/api/registerdUserPanels', async function (req, res) {
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

        // 
        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("ECPANEL");
        });


        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});


app.post('/api/addcandidate/', async function (req, res) {
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

  
        await contract.submitTransaction('createCandidatesObj', req.body.candidateId, req.body.name, req.body.vison,  req.body.chairman_name , req.body.chairman_cnic , req.body.vice_chairman_name , req.body.vice_chairman_cnic, req.body.secretary_name, req.body.secretary_cnic, req.body.attacment,  req.body.password, req.body.user_id , req.body.created_at);
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


app.post('/api/voter-auth11', async function (req, res) {
    try {

        var usercnic = req.body.cnic;
        var password = req.body.password;
        let flag = 1;


        if (usercnic && password) {


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


            var UsersData = aaryData.filter(function (data) {

                return data.Key.startsWith("VOTE");
            });



            var responseData = UsersData.filter(function (data) {

                return data.Record.cnic == usercnic && data.Record.password == password;
            });

            // console.log('UsersData', UsersData);
            // console.log('responseData', responseData);

            if (responseData != '') {

                console.log("success");

                res.statusMessage = "Success";
                res.status(200).json({ response: responseData[0] });
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
});


app.post('/api/voter-auth', async function (req, res) {
    try {

        var usercnic = req.body.cnic;
        var password = req.body.password;
        let flag = 1;


        if (usercnic && password) {


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


            var UsersData = aaryData.filter(function (data) {

                return data.Key.startsWith("VOTE");
            });


            var matches = stringSimilarity.findBestMatch("Rk1SACAyMAAAAAC6AAABBAEsAMUAxQEAAAA3GkCdABUUAEDEACoRAEBrAC+RAECXADOYAEA7AE+aAECGAFIYAEDBAFsNAIAuAGkYAECcAG8RAEBAAIKgAEAmAK0mAEBEALUiAEBoAL+iAEAoAOWgAECaAOgRAEDnAOn0AEBYAOoeAEBMAOwfAEDGAOz4AECIAO8cAIC4APT/AEBGAPUGAEBQAPuHAECxAQb4AECFAQyqAEBsARW7AAAA", [
                "edward",
                "sealed",
                "theatre",
              ]);

              console.log('matches'+ JSON.stringify(matches) );
               

            var data12 = "template1=" + encodeURIComponent('Rk1SACAyMAAAAAC6AAABBAEsAMUAxQEAAAA3GkCdABUUAEDEACoRAEBrAC+RAECXADOYAEA7AE+aAECGAFIYAEDBAFsNAIAuAGkYAECcAG8RAEBAAIKgAEAmAK0mAEBEALUiAEBoAL+iAEAoAOWgAECaAOgRAEDnAOn0AEBYAOoeAEBMAOwfAEDGAOz4AECIAO8cAIC4APT/AEBGAPUGAEBQAPuHAECxAQb4AECFAQyqAEBsARW7AAAA');

            var responseData = UsersData.filter(function (data1) {

                data12 += "&template2=" + encodeURIComponent(data1.Record.template1);
                
                // console.log(data12);
            
            return data1.Record.cnic == usercnic && data1.Record.password == password;
        });
        
        // const curlTest = new Curl();
            
        //         curlTest.setOpt(Curl.option.URL, "https://localhost:8000/SGIMatchScore");
        //         curlTest.setOpt(Curl.option.POST, true);
        //         curlTest.setOpt(
        //             Curl.option.POSTFIELDS,
        //             querystring.stringify({data:data1})
        //             );
                
        //         curlTest.on("end", function (statusCode, data, headers) {
        //         console.info("Status code " + statusCode);
        //         console.info("***");
        //         console.info("Our response: " + data);
        //         console.info("***");
        //         console.info("***");
        //         console.info("Total time taken: " + this.getInfo("TOTAL_TIME"));
            
        //         this.close();
        //     });
            
        //     const terminate = curlTest.close.bind(curlTest);

        //     curlTest.on("error", terminate);
            
        //     curlTest.perform();
            // console.log('UsersData', UsersData);
            // console.log('responseData', responseData);

            if (responseData != '') {

                console.log("success");

                res.statusMessage = "Success";
                res.status(200).json({ response: responseData[0] });
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


app.get('/api/registerdVoters', async function (req, res) {
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


        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("VOTE");
        });


        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});

app.get('/api/getInit-election', async function (req, res) {
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


        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("INIT");
        });


        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});


app.get('/api/registerdCandidates', async function (req, res) {
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


        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("CANDIDATE");
        });


        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});


app.get('/api/registerdElections', async function (req, res) {
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


        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("EL");
        });

        

      
        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});

app.get('/api/totalCastedVotes', async function (req, res) {
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


        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("VCST");
        });

        

      
        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});


app.get('/api/election-details/:electionId', async function (req, res) {
    
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
        const result = await contract.evaluateTransaction('queryElection', req.params.electionId);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        const responseObj = JSON.parse(result.toString());

        var candidates  = JSON.parse(responseObj.candidates);

        responseObj.candidates = candidates;


        res.status(200).json({response: responseObj});
} catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.get('/api/election/', async function (req, res) {
    
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

        const getElectionRecord= await contract.evaluateTransaction('queryAllVoter');
  
        let electionArry = JSON.parse(getElectionRecord.toString());


        var electionid = electionArry.filter(function (data) {

            return data.Key.startsWith("INIT");
        });

        


        if(electionid[0] != undefined && electionid[0] != "")
        {
            const result = await contract.evaluateTransaction('queryElection', electionid[0].Record.electionID);
            
            
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

            const responseObj = JSON.parse(result.toString());
    
            var candidates  = JSON.parse(responseObj.candidates);
    
            responseObj.candidates = candidates;
    

            res.status(200).json({response:responseObj});
        }
        else
        {
            res.status(200).json({response:'no record'});
        }
        

        

} catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});


app.get('/api/voter/:voterID', async function (req, res) {
    
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
        const result = await contract.evaluateTransaction('queryVoter', req.params.voterID);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        const responseObj = JSON.parse(result.toString());

        var candidates  = JSON.parse(responseObj.candidates);

        responseObj.candidates = candidates;


        res.status(200).json({response: responseObj});
} catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});


app.get('/api/check-unique-id/:CNIC', async function (req, res) {
    
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
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        let aaryData = JSON.parse(result.toString());


        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("VOTE");
        });

        
        var ttttt = responseData.filter(function (data) {

            return data.Record.cnic == req.params.CNIC;
        });

        if(ttttt.length == 0)
        {
            res.status(200).json(true);
        }
        else
        {
            res.status(200).json('CNIC already exists');
        }
      
        

       
} catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});


app.post('/api/election-initialize/', async function (req, res) {
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

 
        const result = await contract.evaluateTransaction('queryAllVoter');

        let aaryData = JSON.parse(result.toString());


        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("INIT");
        });
        
        
        if(responseData.length == 0)
        {
            await contract.submitTransaction('setStartElectionByID',req.body.StartelectionID, req.body.electionID , req.body.created_at);
        }

        // console.log(responseData.length == 0);
        
        console.log('Transaction has been submitted');
        res.send('Transaction has been submitted');
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})


app.get('/api/registerdElections', async function (req, res) {
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


        var responseData = aaryData.filter(function (data) {

            return data.Key.startsWith("EL");
        });

        

      
        res.status(200).json({ response: responseData });
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });
        process.exit(1);
    }
});


app.post('/api/vote-cast/', async function (req, res) {
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

        // console.log(req.body);

       
        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction('createVotingCasting',req.body.castID, req.body.CandidateId, req.body.voterID, req.body.electionId, req.body.created_at);
       
        await contract.submitTransaction('getVoted',req.body.voterID, req.body.created_at);

        const result = JSON.parse(Buffer.from(  await contract.evaluateTransaction('queryVoter',req.body.voterID)).toString('utf8')) ;

        // console.log(result);

        console.log('Transaction has been submitted');
        res.send(result);
        // Disconnect from the gateway.
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
})


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


// app.post('/api/posts', verifyToken, (req, res) => {  
//     jwt.verify(req.token, 'secretkey', (err, authData) => {
//       console.log(err);
//       if(err) {
//         res.sendStatus(403);
//       } else {
//         res.json({
//           message: 'Post created...',
//           authData
//         });
//       }
//     });
//   });
  
//   app.post('/api/login', (req, res) => {
//     // Mock user
//     const user = {
//       id: 1, 
//       username: 'brad',
//       email: 'brad@gmail.com'
//     }
  
//     jwt.sign({user}, 'secretkey', { expiresIn: '30s' }, (err, token) => {
//       res.json({
//         token
//       });
//     });
//   });
  
  // FORMAT OF TOKEN
  // Authorization: Bearer <access_token>
  
  // Verify Token
  function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
  
  
    // Check if bearer is undefined
    if(typeof bearerHeader !== 'undefined') {
      // Split at the space
      const bearer = bearerHeader.split(' ');
      // Get token from array
      const bearerToken = bearer[1];
      // Set the token
      req.token = bearerToken;
      // Next middleware
      next();
  
    } else {
      // Forbidden
      res.sendStatus(403);
    }
  
  }


app.listen(8080);