var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserAccessTokenSchema   = new Schema({
    userId:{
        type: String,
    },
    oauthUserToken:{
        type: String,
    },
    oauthUserVerifier:{
        type: String,
    },
    oauthAccessToken:{
        type: String,
    },
    oauthAccessSecret: {
        type: String,
    },
    updatedOn:{
        type: Date
    }
});

module.exports = mongoose.model('obp-user-accesstokens', UserAccessTokenSchema);
