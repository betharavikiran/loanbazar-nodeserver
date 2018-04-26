const express    = require('express');
const bodyParser = require('body-parser');
const app        = express();
const morgan     = require('morgan');
app.use(morgan('dev'));

const dbUrl = 'mongodb://admin:admin123@ds257579.mlab.com:57579/loanbazar-obp';
const consumerId = 'ri0w3q1wlgdo2yiofjevnjhjwofv02cuymbo2fsw';
const consumerKey = 'hyncffal1ouhvwyxm4mtt4hwbln02i2ytwmopqhj';

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = process.env.PORT || 8080;

// DATABASE SETUP
const mongoose   = require('mongoose');
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    console.log("DB connection alive");
});



// Authentication with OBP
const oauth = require('oauth');
const consumer = new oauth.OAuth(
    'https://psd2-api.openbankproject.com/oauth/initiate',
    'https://psd2-api.openbankproject.com/oauth/token',
    consumerId,
    consumerKey,
    '1.0',
    'http://127.0.0.1:3000/callback',
    'HMAC-SHA1');


// Collections to read data from
const TransactionRequests = require('./app/models/transactionRequests');
const UserAccessTokens = require('./app/models/userAccessTokens');

const router = express.Router();

router.use(function(req, res, next) {
	console.log('Hi this is loan bazar node server.');
	next();
});

router.get('/', function(req, res) {
	res.json({ message: 'Loan bazar server started ! welcome to our api!' });
});

router.route('/trans-request')
    .post(function(req, res) {
    	// Create a transaction Request
    	const transactionRequest = new TransactionRequests();
        transactionRequest.fromBankId = req.body.fromBankId;
        transactionRequest.fromAccountId = req.body.fromAccountId;
        transactionRequest.toBankId= req.body.toBankId;
        transactionRequest.toAccountId= req.body.toAccountId;
        transactionRequest.currency= req.body.currency;
        transactionRequest.amount= req.body.amount;
        transactionRequest.transType= req.body.transType;
        transactionRequest.description= req.body.description;
        transactionRequest.userId= req.body.userId;
        transactionRequest.status = 'Pending';

        UserAccessTokens.findOne({ userId: 'bErXm7rfZAFFE6cMb' }, function (err, userAccessToken){
            transactionRequest.save(function(err, data) {
                if (err)
                    res.send(err);

                const _id  = data._id;

                // Prepare Transaction Request
                const toObj = {"bank_id": transactionRequest.toBankId , "account_id": transactionRequest.toAccountId};
                const valueObj = {"currency": transactionRequest.currency, "amount": transactionRequest.amount};

                const detailsObj = {"to": toObj, "value": valueObj, "description": transactionRequest.description}
                const details = JSON.stringify(detailsObj)

                const viewId = "owner"
                const postUrl = "https://psd2-api.openbankproject.com/obp/v2.1.0/banks/" + transactionRequest.fromBankId + "/accounts/" + transactionRequest.fromAccountId + "/" + viewId + "/transaction-request-types/" + transactionRequest.transType + "/transaction-requests";

                consumer.post(postUrl,
                    userAccessToken.oauthAccessToken,
                    userAccessToken.oauthAccessSecret,
                    details,
                    "application/json",
                    function (error, data, response) {
                        if(error){
                            const conditions = { '_id':_id }
                                , update = {  $set:{
                                    status: 'Failed',
                                    failureDetails:error.toString()
                                }}
                                , options = { multi: false };

                            TransactionRequests.update(conditions, update, options, function callback (err, numAffected) {
                                console.log(numAffected);
                            });
                        }
                        else{
                            if(data){
                                const parsedData = JSON.parse(data);
                                const conditions = { '_id':_id }
                                    , update = {  $set:{
                                        status: 'Completed',
                                        obpTransactionRef: parsedData.id
                                    }}
                                    , options = { multi: false };

                                TransactionRequests.update(conditions, update, options, function callback (err, numAffected) {
                                    console.log(numAffected);
                                });
                            }
                        }
                    });

                res.json({ message: 'transaction created!' });
            });
        });
    })

    .get(function(req, res) {
        TransactionRequests.find(function(err, request) {
            if (err)
                res.send(err);

            res.json(request);
        });
    });

app.use('/api', router);

app.listen(port);
console.log('Server running on port:' + port);
