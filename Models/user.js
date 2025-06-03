var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
        id_permission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        },
        username: String,
        password: String,
        fullname: String,
        gender: String,
        email: String,
        phone: String,
      

    }
);

var Users = mongoose.model('Users', schema, 'user');

module.exports = Users;