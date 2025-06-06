const Cart = require('../../../Models/cart');
const mongoose = require('mongoose');

module.exports = {
    // Lấy tất cả sản phẩm trong giỏ hàng của một người dùng
    getCartByUser: async (req, res) => {
        try {
            const userId = req.params.userId;
            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            const cartItems = await Cart.find({ id_user: userId });
            return res.status(200).json(cartItems);
        } catch (error) {
            console.error('Error getting cart items:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Thêm sản phẩm vào giỏ hàng
    addToCart: async (req, res) => {
        try {
            const { id_user, id_product, name_product, price_product, count, image, size, originalPrice } = req.body;
            
            if (!id_user || !id_product || !name_product || !price_product || !count || !size) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
            const existingItem = await Cart.findOne({ 
                id_user: id_user, 
                id_product: id_product,
                size: size 
            });

            if (existingItem) {
                // Nếu đã tồn tại, cập nhật số lượng
                existingItem.count += count;
                await existingItem.save();
                return res.status(200).json(existingItem);
            } else {
                // Nếu chưa tồn tại, tạo mới
                const newCartItem = new Cart({
                    id_user,
                    id_product,
                    name_product,
                    price_product,
                    count,
                    image,
                    size,
                    originalPrice
                });

                await newCartItem.save();
                return res.status(201).json(newCartItem);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCartItem: async (req, res) => {
        try {
            const cartItemId = req.params.id;
            const { count } = req.body;

            if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
                return res.status(400).json({ message: 'Invalid cart item ID' });
            }

            if (count === undefined || count < 1) {
                return res.status(400).json({ message: 'Count must be at least 1' });
            }

            const updatedItem = await Cart.findByIdAndUpdate(
                cartItemId,
                { count: count },
                { new: true }
            );

            if (!updatedItem) {
                return res.status(404).json({ message: 'Cart item not found' });
            }

            return res.status(200).json(updatedItem);
        } catch (error) {
            console.error('Error updating cart item:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Xóa một sản phẩm khỏi giỏ hàng
    removeCartItem: async (req, res) => {
        try {
            const cartItemId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
                return res.status(400).json({ message: 'Invalid cart item ID' });
            }

            const deletedItem = await Cart.findByIdAndDelete(cartItemId);

            if (!deletedItem) {
                return res.status(404).json({ message: 'Cart item not found' });
            }

            return res.status(200).json({ message: 'Cart item removed successfully' });
        } catch (error) {
            console.error('Error removing cart item:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    },

    // Xóa tất cả sản phẩm trong giỏ hàng của một người dùng
    clearCart: async (req, res) => {
        try {
            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            const result = await Cart.deleteMany({ id_user: userId });

            return res.status(200).json({ 
                message: 'Cart cleared successfully', 
                deletedCount: result.deletedCount 
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}; 