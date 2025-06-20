var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
        id_user: {
            type: String,
            ref: 'Users'
        },
        id_payment: {
            type: String,
            ref: 'Payment'
        },
        id_note: {
            type: String,
            ref: 'Note'
        },
        address: String,
        total: Number,
        status: String,
        pay: Boolean,
        feeship: Number,
        id_coupon: String,
        coupon_restored: {
            type: Boolean,
            default: false
        },
        coupon_used_final: {
            type: Boolean,
            default: false
        },
        create_time: String
    }
);

var Order = mongoose.model('Order', schema, 'order');

module.exports = Order;