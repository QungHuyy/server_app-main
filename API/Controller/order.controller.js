const mailer = require('../../mailer')
const crypto = require('crypto')

const Order = require('../../Models/order')
const Detail_Order = require('../../Models/detail_order')
const Note = require('../../Models/note')
const Products = require('../../Models/product')

// Đặt hàng
module.exports.post_order = async (req, res) => {
    try {
        // Tạo đơn hàng với status = 1 (Đang xử lý)
        const order = await Order.create(req.body);
        
        // Không cần xử lý trừ số lượng ở đây nữa vì đã xử lý ở post_detail_order
        // Việc trừ số lượng sản phẩm sẽ được thực hiện khi tạo từng chi tiết đơn hàng
        
        res.json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Đã xảy ra lỗi khi tạo đơn hàng" });
    }
}

module.exports.send_mail = async (req, res) => {

    const carts = await Detail_Order.find({ id_order: req.body.id_order }).populate('id_product')

    //B3: Bắt đầu gửi Mail xác nhận đơn hàng
    const htmlHead = '<table style="width:50%">' +
        '<tr style="border: 1px solid black;"><th style="border: 1px solid black;">Tên Product</th><th style="border: 1px solid black;">Hình Ảnh</th><th style="border: 1px solid black;">Giá</th><th style="border: 1px solid black;">Số Lượng</th><th style="border: 1px solid black;">Size</th><th style="border: 1px solid black;">Thành Tiền</th>'

    let htmlContent = ""

    for (let i = 0; i < carts.length; i++) {
        htmlContent += '<tr>' +
            '<td style="border: 1px solid black; font-size: 1.2rem; text-align: center;">' + carts[i].id_product.name_product + '</td>' +
            '<td style="border: 1px solid black; font-size: 1.2rem; text-align: center;"><img src="' + carts[i].id_product.image + '" width="80" height="80"></td>' +
            '<td style="border: 1px solid black; font-size: 1.2rem; text-align: center;">' + carts[i].id_product.price_product + '$</td>' +
            '<td style="border: 1px solid black; font-size: 1.2rem; text-align: center;">' + carts[i].count + '</td>' +
            '<td style="border: 1px solid black; font-size: 1.2rem; text-align: center;">' + carts[i].size + '</td>' +
            '<td style="border: 1px solid black; font-size: 1.2rem; text-align: center;">' + (parseInt(carts[i].id_product.price_product) * parseInt(carts[i].count)) + '$</td>' +
            '<tr>'
    }

    const htmlResult = '<h1>Xin Chào ' + req.body.fullname + '</h1>' + '<h3>Phone: ' + req.body.phone + '</h3>' + '<h3>Address:' + req.body.address + '</h3>' +
        htmlHead + htmlContent + '<h1>Phí Vận Chuyển: ' + req.body.price + '$</h1></br>' + '<h1>Tổng Thanh Toán: ' + req.body.total + '$</h1></br>' + '<p>Cảm ơn bạn!</p>'

    // Thực hiện gửi email (to, subject, htmlContent)
    await mailer.sendMail(req.body.email, 'Hóa Đơn Đặt Hàng', htmlResult)

    res.send("Gui Email Thanh Cong")

}

module.exports.get_order = async (req, res) => {

    const id_user = req.params.id

    const orders = await Order.find({ id_user }).populate(['id_user', 'id_note'])

    // Kiểm tra xem có đơn hàng nào không
    if (!orders || orders.length === 0) {
        return res.json([]);
    }

    console.log(`Found ${orders.length} orders for user ${id_user}`);
    
    // Đảm bảo trả về đơn hàng đã hủy (status = 5) trong kết quả
    const allOrders = orders.map(order => {
        // Nếu status là 5, đổi thành 0 để hiển thị trong tab "Đã hủy"
        if (order.status === "5") {
            const orderObj = order.toObject();
            orderObj.status = "0";
            return orderObj;
        }
        return order;
    });

    console.log(`Returning ${allOrders.length} orders with status mapping`);
    
    res.json(allOrders)

}

module.exports.get_detail = async (req, res) => {

    const id_order = req.params.id

    const order = await Order.findOne({ _id: id_order }).populate(['id_user', 'id_note', 'id_payment'])

    res.json(order)

}

module.exports.post_momo = async (req, res) => {

    const serectkey = "uLb683H8g9dWuiyipZbLHgO6zjSDlVm5"
    const accessKey = req.body.accessKey
    const amount = req.body.amount
    const extraData = req.body.extraData
    const errorCode = req.body.errorCode
    const localMessage = req.body.localMessage
    const message = req.body.message
    const orderId = req.body.orderId
    const orderInfo = req.body.orderInfo
    const orderType = req.body.orderType
    const partnerCode = req.body.partnerCode
    const payType = req.body.payType
    const requestId = req.body.requestId
    const responseTime = req.body.responseTime
    const transId = req.body.transId

    let param = `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${requestId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&message=${message}&localMessage=${localMessage}&responseTime=${responseTime}&errorCode=${errorCode}&payType=${payType}&extraData=${extraData}`

    var signature = crypto.createHmac('sha256', serectkey)
        .update(param)
        .digest('hex');

    if (req.body.signature !== signature) {
        res.send("Thông tin request không hợp lệ")
        return;
    }
    if (errorCode == 0) {
        res.send("Thanh Cong")
    } else {
        res.send("Thanh toán thất bại")
    }

}

// Giả sử đây là hàm xử lý tạo đơn hàng
module.exports.create = async (req, res) => {
    // Code xử lý tạo đơn hàng hiện tại...
    
    // Sau khi tạo đơn hàng thành công, cập nhật số lượng Product
    const products = req.body.products; // Giả sử đây là danh sách Product trong đơn hàng
    
    for (let item of products) {
        const product = await Product.findById(item.id_product);
        if (product) {
            product.number = Math.max(0, product.number - item.count);
            await product.save();
        }
    }
    
    // Phần code còn lại...
}

module.exports.post_paypal = async (req, res) => {

     var create_payment_json = {
         "intent": "authorize",
         "payer": {
             "payment_method": "paypal"
         },
         "redirect_urls": {
             "return_url": "http://localhost:3000/success",
             "cancel_url": "http://localhost:3000/fail"
         },
         "transactions": [{
             "item_list": {
                 "items": [{
                     "name": "item", // Tên Product
                     "sku": "item", // mã Product
                     "price": "1.00", // giá tiền
                     "currency": "USD",
                     "quantity": 1 // số lượng
                 }]
             },
             "amount": {
                 "currency": "USD",
                 "total": "1.00" 
             },
             "description": "This is the payment description."
         }]
     };

     paypal.payment.create(create_payment_json, function (error, payment) {
         if (error) {
             console.log(error.response);
             throw error;
         } else {
             for (var index = 0; index < payment.links.length; index++) {
                 if (payment.links[index].rel === 'approval_url') {
                     console.log(payment.links[index].href);
                 }
             }
             console.log(payment);
         }
     });

     res.send("Thanh Cong")

 }
