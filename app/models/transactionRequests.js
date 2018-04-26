var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var TransactionRequestSchema   = new Schema({
    fromBankId: {
        type: String,
    },
    fromAccountId: {
        type: String,
    },
    toBankId: {
        type: String,
        optional:true
    },
    toAccountId: {
        type: String,
        optional:true
    },
    counterPartyId: {
        type: String,
        optional:true
    },
    iBan: {
        type: String,
        optional:true
    },
    currency: {
        type: String,
    },
    amount: {
        type: String,
    },
    transType: {
        type: String,
    },
    description: {
        type: String,
    },
    userId: {
        type: String,
        max: 32,
    },
    status:{
        type: String,
        allowedValues:['Pending','Failed', 'Completed']
    },
    obpTransactionRef:{
        type: String,
        optional:true
    },
    failureDetails:{
        type: String,
        optional:true
    }
});

module.exports = mongoose.model('obp-transaction-requests', TransactionRequestSchema);