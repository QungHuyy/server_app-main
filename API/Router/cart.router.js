const express = require('express');
const router = express.Router();
const cartController = require('../Controller/client/cart.controller');

// Lấy giỏ hàng theo user ID
router.get('/user/:userId', cartController.getCartByUser);

// Thêm sản phẩm vào giỏ hàng
router.post('/', cartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/:id', cartController.updateCartItem);

// Xóa một sản phẩm khỏi giỏ hàng
router.delete('/:id', cartController.removeCartItem);

// Xóa tất cả sản phẩm trong giỏ hàng của một người dùng
router.delete('/user/:userId', cartController.clearCart);

module.exports = router; 