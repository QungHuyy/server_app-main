const Favorite = require('../../Models/favorite');
const Product = require('../../Models/product');

// Lấy danh sách sản phẩm yêu thích của user
const getFavorites = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Getting favorites for user:', userId);
        
        // Tìm tất cả favorite của user và populate thông tin sản phẩm
        const favorites = await Favorite.find({ id_user: userId }).populate('id_product');
        
        // Lọc ra những sản phẩm còn tồn tại
        const validFavorites = favorites.filter(fav => fav.id_product);
        
        console.log('Found favorites:', validFavorites.length);
        
        res.status(200).json({
            success: true,
            message: 'Lấy danh sách yêu thích thành công',
            data: validFavorites
        });
    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách yêu thích',
            error: error.message
        });
    }
};

// Thêm sản phẩm vào yêu thích
const addFavorite = async (req, res) => {
    try {
        const { id_user, id_product } = req.body;
        console.log('Adding favorite:', { id_user, id_product });
        
        if (!id_user || !id_product) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin user hoặc sản phẩm'
            });
        }
        
        // Kiểm tra xem sản phẩm có tồn tại không
        const product = await Product.findById(id_product);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại'
            });
        }
        
        // Kiểm tra xem đã yêu thích chưa
        const existingFavorite = await Favorite.findOne({ id_user, id_product });
        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: 'Sản phẩm đã có trong danh sách yêu thích'
            });
        }
        
        // Tạo favorite mới
        const newFavorite = new Favorite({ id_user, id_product });
        await newFavorite.save();
        
        console.log('Favorite added successfully');
        
        res.status(201).json({
            success: true,
            message: 'Đã thêm sản phẩm vào yêu thích',
            data: newFavorite
        });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm vào yêu thích',
            error: error.message
        });
    }
};

// Xóa sản phẩm khỏi yêu thích
const removeFavorite = async (req, res) => {
    try {
        const { id_user, id_product } = req.body;
        console.log('Removing favorite:', { id_user, id_product });
        
        if (!id_user || !id_product) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin user hoặc sản phẩm'
            });
        }
        
        // Tìm và xóa favorite
        const deletedFavorite = await Favorite.findOneAndDelete({ id_user, id_product });
        
        if (!deletedFavorite) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không có trong danh sách yêu thích'
            });
        }
        
        console.log('Favorite removed successfully');
        
        res.status(200).json({
            success: true,
            message: 'Đã xóa sản phẩm khỏi yêu thích'
        });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa khỏi yêu thích',
            error: error.message
        });
    }
};

// Kiểm tra sản phẩm có trong yêu thích không
const checkFavorite = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        console.log('Checking favorite:', { userId, productId });
        
        const favorite = await Favorite.findOne({ 
            id_user: userId, 
            id_product: productId 
        });
        
        const isFavorite = !!favorite;
        console.log('Is favorite:', isFavorite);
        
        res.status(200).json({
            success: true,
            isFavorite: isFavorite
        });
    } catch (error) {
        console.error('Error checking favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi kiểm tra yêu thích',
            error: error.message
        });
    }
};

module.exports = {
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavorite
}; 