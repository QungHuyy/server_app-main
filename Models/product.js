var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    id_category: { type: String, ref: 'Category' },
    name_product: String,
    price_product: String,
    image: String,
    describe: String,
    gender: String,
    inventory: {
        S: { type: Number, default: 0 },
        M: { type: Number, default: 0 },
        L: { type: Number, default: 0 }
    },
    number: Number,
    feature_vector: {
        type: [Number], // Mảng số thực lưu vector đặc trưng
        default: []
    }
});


var Products = mongoose.model('Products', schema, 'product');

module.exports = Products;
