var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
        id_user: {
            type: String,
            ref: 'Users',
            required: true
        },
        id_product: {
            type: String,
            ref: 'Products',
            required: true
        }
    },
    {
        timestamps: true
    }
);

var Favorite = mongoose.model('Favorite', schema, 'favorite');

module.exports = Favorite;