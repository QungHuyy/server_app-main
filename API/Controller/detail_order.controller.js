const Detail_Order = require('../../Models/detail_order')
const Products = require('../../Models/product')

// Hiển thị chi tiết hóa đơn
// Phương thức GET
module.exports.detail = async (req, res) => {

    const id_order = req.params.id

    const detail_order = await Detail_Order.find({ id_order: id_order }).populate('id_product')

    res.json(detail_order)

}

// Phuong Thuc Post
module.exports.post_detail_order = async (req, res) => {
    try {
        // Kiểm tra xem đã có inventory trong request
        let orderData = req.body;
        
        // Đảm bảo inventory đúng định dạng, với size và count tương ứng
        if (!orderData.inventory || Object.keys(orderData.inventory).length === 0) {
            orderData.inventory = {
                [orderData.size]: parseInt(orderData.count)
            };
        }
        
        console.log(`[post_detail_order] Tạo chi tiết đơn hàng: Sản phẩm ${orderData.id_product}, Size ${orderData.size}, SL ${orderData.count}`);
        
        // Tạo chi tiết đơn hàng với trạng thái ban đầu, chưa hoàn lại inventory
        orderData.inventory_restored = false;
        const detail_order = await Detail_Order.create(orderData);
        
        // Lấy thông tin sản phẩm
        const product = await Products.findOne({ _id: detail_order.id_product });
        
        if (product) {
            const productInventory = product.inventory || { S: 0, M: 0, L: 0 };
            const size = detail_order.size;
            const count = parseInt(detail_order.count);
            
            // Cập nhật inventory sản phẩm nếu có size cụ thể
            if (size && productInventory[size] !== undefined) {
                console.log(`[post_detail_order] Trước khi trừ: Sản phẩm ${product._id}, Size ${size}, Tồn kho ${productInventory[size]}`);
                
                // Trừ số lượng trong kho
                productInventory[size] = Math.max(0, productInventory[size] - count);
                
                console.log(`[post_detail_order] Sau khi trừ: Sản phẩm ${product._id}, Size ${size}, Tồn kho ${productInventory[size]}`);
                
                // Cập nhật lại inventory của sản phẩm
                await Products.updateOne(
                    { _id: detail_order.id_product },
                    { inventory: productInventory }
                );
                
                console.log(`[post_detail_order] Đã trừ ${count} sản phẩm size ${size} từ sản phẩm ${detail_order.id_product}`);
            }
        }
        
        res.send("Thanh Cong");
    } catch (error) {
        console.error("[post_detail_order] Lỗi khi xử lý chi tiết đơn hàng:", error);
        res.status(500).send("Đã xảy ra lỗi");
    }
}