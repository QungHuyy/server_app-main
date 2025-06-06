const Coupon = require('../../../Models/coupon');
const Order = require('../../../Models/order');

module.exports.index = async (req, res) => {

    let page = parseInt(req.query.page) || 1;
    const keyWordSearch = req.query.search;

    const perPage = parseInt(req.query.limit) || 8;
    const totalPage = Math.ceil(await Coupon.countDocuments() / perPage);

    let start = (page - 1) * perPage;
    let end = page * perPage;

    const coupon = await Coupon.find();

    if (!keyWordSearch) {
        res.json({
            coupons: coupon.slice(start, end),
            totalPage: totalPage
        })

    } else {
        var newData = coupon.filter(value => {
            return value.code.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1 ||
                value.promotion.toUpperCase().indexOf(keyWordSearch.toUpperCase()) !== -1
        })

        res.json({
            coupons: newData.slice(start, end),
            totalPage: totalPage
        })
    }

}

module.exports.create = async (req, res) => {
    try {
        // Kiểm tra xem mã giảm giá đã tồn tại chưa
        const existingCoupon = await Coupon.findOne({ code: req.body.code });

        if (existingCoupon) {
            return res.status(400).json({ msg: "Mã giảm giá này đã tồn tại, vui lòng chọn mã khác" });
        }

        // Nếu không trùng, tạo mã giảm giá mới
        await Coupon.create(req.body);

        res.json({ msg: "Bạn đã thêm thành công" });
    } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ msg: "Đã xảy ra lỗi khi tạo mã giảm giá" });
    }
}

module.exports.update = async (req, res) => {
    try {
        const id = req.params.id;

        // Kiểm tra xem mã giảm giá đã tồn tại chưa (trừ mã hiện tại)
        const existingCoupon = await Coupon.findOne({
            code: req.body.code,
            _id: { $ne: id } // Không tính mã hiện tại
        });

        if (existingCoupon) {
            return res.status(400).json({ msg: "Mã giảm giá này đã tồn tại, vui lòng chọn mã khác" });
        }

        const coupon = await Coupon.findOne({ _id: id });

        if (!coupon) {
            return res.status(404).json({ msg: "Không tìm thấy mã giảm giá" });
        }

        coupon.code = req.body.code;
        coupon.count = req.body.count;
        coupon.promotion = req.body.promotion;
        coupon.describe = req.body.describe;

        await coupon.save();

        res.json({ msg: "Bạn đã cập nhật thành công" });
    } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ msg: "Đã xảy ra lỗi khi cập nhật mã giảm giá" });
    }
}

module.exports.delete = async (req, res) => {

    const id = req.params.id

    await Coupon.deleteOne({ _id: id })

    res.json("Thanh Cong")

}

module.exports.detail = async (req, res) => {

    const id = req.params.id

    const coupon = await Coupon.findOne({ _id: id })

    res.json(coupon)

}

module.exports.checking = async (req, res) => {
    try {
        const code = req.query.code;
        const id_user = req.query.id_user;

        console.log(`Checking coupon code: ${code} for user: ${id_user}`);

        // Kiểm tra xem mã giảm giá có tồn tại không
        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            console.log(`Coupon not found: ${code}`);
            return res.json({ msg: "Không tìm thấy" });
        }

        // Kiểm tra xem số lượng mã giảm giá còn không
        if (coupon.count <= 0) {
            console.log(`Coupon out of uses: ${code}`);
            return res.json({ msg: "Mã giảm giá đã hết lượt sử dụng" });
        }

        // Kiểm tra tất cả đơn hàng của người dùng với mã giảm giá này
        const allOrders = await Order.find({ 
            id_user: id_user, 
            id_coupon: coupon._id 
        });
        
        console.log(`Found ${allOrders.length} orders with this coupon for user ${id_user}`);
        
        // Nếu không có đơn hàng nào, cho phép sử dụng
        if (allOrders.length === 0) {
            console.log(`No orders found with coupon ${code}, allowing use`);
            return res.json({ msg: "Thành công", coupon: coupon });
        }
        
        // Kiểm tra xem có đơn hàng nào đã hoàn thành với mã giảm giá này không
        const completedOrder = allOrders.find(order => order.status === "4");
        if (completedOrder) {
            console.log(`Found completed order with coupon ${code}, denying use`);
            return res.json({ msg: "Bạn đã sử dụng mã này rồi" });
        }
        
        // Kiểm tra xem có đơn hàng đang xử lý với mã giảm giá này không
        const pendingOrder = allOrders.find(order => ["1", "2", "3"].includes(order.status));
        if (pendingOrder) {
            console.log(`Found pending order with coupon ${code}, denying use`);
            return res.json({ msg: "Bạn đã sử dụng mã này trong một đơn hàng đang xử lý" });
        }
        
        // Nếu tất cả đơn hàng đều đã bị hủy, cho phép sử dụng lại
        console.log(`All orders with coupon ${code} are cancelled, allowing reuse`);
        return res.json({ msg: "Thành công", coupon: coupon });
    } catch (error) {
        console.error("Error checking coupon:", error);
        return res.status(500).json({ msg: "Đã xảy ra lỗi khi kiểm tra mã giảm giá" });
    }
}

module.exports.createCoupon = async (req, res) => {
    try {
        const id = req.params.id;

        const coupon = await Coupon.findOne({ _id: id });

        if (!coupon) {
            return res.status(404).json({ msg: "Không tìm thấy mã giảm giá" });
        }

        // Kiểm tra xem số lượng mã giảm giá còn không
        if (coupon.count <= 0) {
            return res.status(400).json({ msg: "Mã giảm giá đã hết lượt sử dụng" });
        }

        coupon.count = parseInt(coupon.count) - 1;

        await coupon.save();

        return res.json({ msg: "Thanh Cong" });
    } catch (error) {
        console.error("Error updating coupon count:", error);
        return res.status(500).json({ msg: "Đã xảy ra lỗi khi cập nhật số lượng mã giảm giá" });
    }
}

// Thêm chức năng hoàn lại mã giảm giá khi đơn hàng bị hủy
module.exports.restoreCoupon = async (req, res) => {
    try {
        const { id_coupon, id_order } = req.body;

        // Kiểm tra xem mã giảm giá có tồn tại không
        const coupon = await Coupon.findOne({ _id: id_coupon });
        if (!coupon) {
            return res.status(404).json({ msg: "Không tìm thấy mã giảm giá" });
        }

        // Kiểm tra xem đơn hàng có tồn tại và có sử dụng mã giảm giá này không
        const order = await Order.findOne({ _id: id_order, id_coupon: id_coupon });
        if (!order) {
            return res.status(404).json({ msg: "Không tìm thấy đơn hàng hoặc đơn hàng không sử dụng mã giảm giá này" });
        }

        // Tăng số lượng mã giảm giá lên 1
        coupon.count = parseInt(coupon.count) + 1;
        await coupon.save();

        // Cập nhật đơn hàng để đánh dấu đã hoàn lại mã giảm giá
        order.coupon_restored = true;
        await order.save();

        return res.json({ 
            msg: "Đã hoàn lại mã giảm giá thành công", 
            coupon: coupon 
        });
    } catch (error) {
        console.error("Error restoring coupon:", error);
        return res.status(500).json({ msg: "Đã xảy ra lỗi khi hoàn lại mã giảm giá" });
    }
}