var express = require('express');
var router = express.Router();

var FavoriteController = require('../Controller/favorite.controller');

// GET /api/Favorite/:userId - Lấy danh sách sản phẩm yêu thích của user
router.get('/:userId', FavoriteController.getFavorites);

// POST /api/Favorite - Thêm sản phẩm vào yêu thích
router.post('/', FavoriteController.addFavorite);

// DELETE /api/Favorite - Xóa sản phẩm khỏi yêu thích
router.delete('/', FavoriteController.removeFavorite);

// GET /api/Favorite/check/:userId/:productId - Kiểm tra sản phẩm có trong yêu thích không
router.get('/check/:userId/:productId', FavoriteController.checkFavorite);

module.exports = router; 