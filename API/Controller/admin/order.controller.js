const Order = require('../../../Models/order')
const Detail_History = require('../../../Models/detail_order')
const Payment = require('../../../Models/payment')
const Delivery = require('../../../Models/delivery')
const Products = require("../../../Models/product")
const Detail_Order = require("../../../Models/detail_order")

module.exports.index = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    let money = 0;

    const status = req.query.status

    const perPage = parseInt(req.query.limit) || 8;

    let start = (page - 1) * perPage;
    let end = page * perPage;

    let orders
    if (status) {
        orders = await (await Order.find({ status: status }).populate('id_user').populate('id_payment').populate('id_note')).reverse();
    } else {
        orders = await (await Order.find().populate('id_user').populate('id_note').populate('id_payment')).reverse();
    }

    const totalPage = Math.ceil(orders.length / perPage);

    orders.map((value) => {
        money += Number(value.total);
    })

    res.json({
        orders: orders.slice(start, end),
        totalPage: totalPage,
        totalMoney: money
    })


}

module.exports.detailOrder = async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const keyWordSearch = req.query.search;

    const perPage = parseInt(req.query.limit) || 8;

    let start = (page - 1) * perPage;
    let end = page * perPage;

    const details = await Detail_History.find({ id_order: req.params.id }).populate('id_order').populate('id_product');

    const totalPage = Math.ceil(details.length / perPage);

    if (!keyWordSearch) {
        res.json({
            details: details.slice(start, end),
            totalPage: totalPage
        })
    } else {
        var newData = details.filter(value => {
            return value.name_product.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.price_product.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.count.toString().toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.size.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1
        })

        res.json({
            details: newData.slice(start, end),
            totalPage: totalPage
        })
    }
}

module.exports.details = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id }).populate('id_user').populate('id_payment').populate('id_note');

    res.json(order)

}

module.exports.confirmOrder = async (req, res) => {
    await Order.updateOne({ _id: req.query.id }, { status: "2" }, function (err, res) {
        if (err) return res.json({ msg: err });
    });
    res.json({ msg: "Thanh Cong" })
}

// module.exports.delivery = async (req, res) => {
//     await Order.updateOne({ _id: req.query.id }, { status: "3" },async function (err, res) {


//         const DetailOrder = await Detail_Order.findOne({id_order: req.query.id})
//         const  inventory= DetailOrder.inventory
//        console.log(inventory);


//         if (err) return res.json({ msg: err });
//     });

//     res.json({ msg: "Thanh Cong" })
// }
module.exports.delivery = async (req, res) => {
  try {
    // Chỉ cập nhật trạng thái đơn hàng, không cần xử lý inventory
    await Order.updateOne({ _id: req.query.id }, { status: "3" });
    res.json({ msg: "Thanh Cong" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Lỗi server" });
  }
};

module.exports.confirmDelivery = async (req, res) => {
    try {
        // Lấy thông tin đơn hàng
        const order = await Order.findOne({ _id: req.query.id });
        
        if (!order) {
            return res.status(404).json({ msg: "Không tìm thấy đơn hàng" });
        }
        
        console.log(`Confirming delivery for order ${req.query.id}`);
        
        // Cập nhật trạng thái đơn hàng thành hoàn thành và đã thanh toán
        await Order.updateOne({ _id: req.query.id }, { status: "4", pay: true });
        
        // Không cần hoàn lại mã giảm giá nếu đơn hàng hoàn thành
        // Đánh dấu mã giảm giá đã được sử dụng chính thức
        if (order.id_coupon) {
            console.log(`Marking coupon ${order.id_coupon} as used for order ${order._id}`);
            await Order.updateOne({ _id: req.query.id }, { coupon_used_final: true });
        }
        
        res.json({ msg: "Thanh Cong" });
    } catch (error) {
        console.error("Error confirming delivery:", error);
        res.status(500).json({ msg: "Đã xảy ra lỗi khi xác nhận giao hàng" });
    }
}

module.exports.cancelOrder = async (req, res) => {
    try {
        // Lấy thông tin đơn hàng trước khi cập nhật
        const order = await Order.findOne({ _id: req.query.id });
        
        if (!order) {
            return res.status(404).json({ msg: "Không tìm thấy đơn hàng" });
        }
        
        console.log(`[cancelOrder] Hủy đơn hàng ${req.query.id}, trạng thái hiện tại: ${order.status}`);
        
        // Kiểm tra xem đơn hàng đã bị hủy chưa
        if (order.status === "5") {
            console.log(`[cancelOrder] Đơn hàng ${req.query.id} đã bị hủy trước đó.`);
            return res.json({ msg: "Đơn hàng đã bị hủy trước đó" });
        }
        
        // Hoàn lại số lượng sản phẩm vào inventory chỉ nếu đơn hàng đang ở trạng thái chưa hoàn thành
        if (order.status !== "4") {
            // Lấy tất cả chi tiết đơn hàng
            const orderDetails = await Detail_Order.find({ id_order: req.query.id });
            console.log(`[cancelOrder] Tìm thấy ${orderDetails.length} sản phẩm trong đơn hàng để hoàn lại số lượng`);
            
            for (const detail of orderDetails) {
                // Kiểm tra nếu chi tiết đơn hàng này đã được hoàn lại số lượng rồi thì bỏ qua
                if (detail.inventory_restored) {
                    console.log(`[cancelOrder] Sản phẩm ${detail.id_product} size ${detail.size} đã được hoàn lại số lượng trước đó, bỏ qua.`);
                    continue;
                }
                
                // Lấy thông tin sản phẩm
                const product = await Products.findOne({ _id: detail.id_product });
                if (!product) {
                    console.log(`[cancelOrder] Không tìm thấy sản phẩm ${detail.id_product}`);
                    continue;
                }
                
                const productInventory = product.inventory || { S: 0, M: 0, L: 0 };
                const size = detail.size;
                const count = parseInt(detail.count);
                
                // Hoàn lại số lượng cho size đó
                if (size && productInventory[size] !== undefined) {
                    console.log(`[cancelOrder] Trước khi hoàn lại: Sản phẩm ${product._id}, Size ${size}, Tồn kho ${productInventory[size]}`);
                    
                    // Cộng lại số lượng vào kho
                    productInventory[size] += count;
                    
                    console.log(`[cancelOrder] Sau khi hoàn lại: Sản phẩm ${product._id}, Size ${size}, Tồn kho ${productInventory[size]}`);
                    console.log(`[cancelOrder] Đã hoàn lại ${count} sản phẩm size ${size} cho sản phẩm ${detail.id_product}`);
                    
                    // Cập nhật lại inventory của sản phẩm
                    await Products.updateOne(
                        { _id: detail.id_product },
                        { inventory: productInventory }
                    );
                    
                    // Đánh dấu đã hoàn lại inventory cho chi tiết đơn hàng này
                    await Detail_Order.updateOne(
                        { _id: detail._id },
                        { inventory_restored: true }
                    );
                }
            }
        } else {
            console.log(`[cancelOrder] Đơn hàng ${req.query.id} đã hoàn thành (status=4), không hoàn lại số lượng.`);
        }
        
        // Cập nhật trạng thái đơn hàng thành hủy
        await Order.updateOne({ _id: req.query.id }, { status: "5" });
        console.log(`[cancelOrder] Đã cập nhật trạng thái đơn hàng ${req.query.id} thành 'Đã hủy'`);
        
        // Xử lý hoàn lại mã giảm giá nếu có
        if (order.id_coupon && !order.coupon_restored) {
            try {
                // Hoàn lại mã giảm giá trực tiếp
                const Coupon = require('../../../Models/coupon');
                
                // Tìm mã giảm giá
                const coupon = await Coupon.findOne({ _id: order.id_coupon });
                
                if (coupon) {
                    console.log(`[cancelOrder] Tìm thấy mã giảm giá ${coupon.code} với số lượng hiện tại ${coupon.count}`);
                    
                    // Tăng số lượng mã giảm giá lên 1
                    coupon.count = parseInt(coupon.count) + 1;
                    await coupon.save();
                    
                    console.log(`[cancelOrder] Đã cập nhật số lượng mã giảm giá thành ${coupon.count}`);
                    
                    // Đánh dấu đơn hàng đã được hoàn lại mã giảm giá và xóa liên kết
                    await Order.updateOne(
                        { _id: req.query.id }, 
                        { 
                            coupon_restored: true,
                            id_coupon: null // Xóa liên kết với mã giảm giá
                        }
                    );
                    
                    console.log(`[cancelOrder] Đã hoàn lại mã giảm giá ${order.id_coupon} cho đơn hàng ${order._id}`);
                } else {
                    console.log(`[cancelOrder] Không tìm thấy mã giảm giá ${order.id_coupon}`);
                }
            } catch (couponError) {
                console.error("[cancelOrder] Lỗi khi hoàn lại mã giảm giá:", couponError);
                // Vẫn tiếp tục xử lý, không trả về lỗi
            }
        }
        
        res.json({ msg: "Thanh Cong" });
    } catch (error) {
        console.error("[cancelOrder] Lỗi khi hủy đơn hàng:", error);
        res.status(500).json({ msg: "Đã xảy ra lỗi khi hủy đơn hàng" });
    }
}


module.exports.completeOrder = async (req, res) => {

    let page = parseInt(req.query.page) || 1;
    let money = 0;

    const getDate = req.query.getDate
    const productId = req.query.productId

    const perPage = parseInt(req.query.limit) || 8;

    let start = (page - 1) * perPage;
    let end = page * perPage;

    // Lấy tất cả đơn hàng đã hoàn thành
    const orders = await (await Order.find({ status: '4' }).populate('id_user').populate('id_payment').populate('id_note')).reverse();

    // Lọc đơn hàng theo ngày nếu có
    let filteredOrders = orders;
    if (getDate) {
        filteredOrders = orders.filter(value => {
            return value.create_time.toString().indexOf(getDate.toString()) !== -1
        });
    }

    // Nếu có lọc theo sản phẩm
    if (productId) {
        // Lấy tất cả chi tiết đơn hàng có chứa sản phẩm được chọn
        const orderDetailsWithProduct = await Detail_Order.find({
            id_product: productId
        });

        // Lấy danh sách ID đơn hàng có chứa sản phẩm
        const orderIdsWithProduct = orderDetailsWithProduct.map(detail => detail.id_order);

        // Lọc đơn hàng theo ID
        filteredOrders = filteredOrders.filter(order =>
            orderIdsWithProduct.includes(order._id.toString())
        );
    }

    // Lấy thông tin chi tiết sản phẩm cho mỗi đơn hàng
    const ordersWithProductDetails = [];
    for (const order of filteredOrders) {
        // Lấy chi tiết đơn hàng
        const orderDetails = await Detail_Order.find({ id_order: order._id.toString() }).populate('id_product');

        // Tạo một bản sao của đơn hàng để thêm thông tin sản phẩm
        const orderWithProducts = order.toObject();

        // Thêm thông tin sản phẩm vào đơn hàng
        orderWithProducts.productDetails = orderDetails;

        ordersWithProductDetails.push(orderWithProducts);
    }

    // Tính tổng tiền
    ordersWithProductDetails.forEach(value => {
        money += Number(value.total);
    });

    const totalPage = Math.ceil(ordersWithProductDetails.length / perPage);

    res.json({
        orders: ordersWithProductDetails.slice(start, end),
        totalPage: totalPage,
        totalMoney: money
    });

}