const express = require('express');
const router = express.Router();
const Products = require('../../Models/product');

// Import controller (convert from ES6 to CommonJS)
const chatController = require('../Controller/chatbot.controller');

// POST /api/Chatbot/chat
router.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Thiếu trường 'message'" });
    }

    try {
        const { OpenAI } = require("openai");
        
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Lấy tất cả sản phẩm từ database
        const products = await Products.find().limit(50); // Limit để tránh quá tải
        
        // Format sản phẩm thành text cho AI
        const productsList = products.map(product => {
            return `- ${product.name_product} (${product.gender}): ${parseInt(product.price_product).toLocaleString('vi-VN')}đ - ${product.describe || 'Sản phẩm chất lượng cao'} [ID: ${product._id}]`;
        }).join('\n');

        // Phân loại sản phẩm theo gender
        const maleProducts = products.filter(p => p.gender === 'Male');
        const femaleProducts = products.filter(p => p.gender === 'Female');
        const unisexProducts = products.filter(p => p.gender === 'Unisex');

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `Bạn là nhân viên tư vấn sản phẩm thời trang chuyên nghiệp của cửa hàng. 

DANH SÁCH SẢN PHẨM HIỆN CÓ:
${productsList}

THỐNG KÊ:
- Sản phẩm nam: ${maleProducts.length} items
- Sản phẩm nữ: ${femaleProducts.length} items  
- Sản phẩm unisex: ${unisexProducts.length} items

NHIỆM VỤ:
- Tư vấn dựa CHÍNH XÁC trên sản phẩm có trong danh sách trên
- Đề xuất sản phẩm cụ thể với tên và giá
- Khi recommend sản phẩm, ghi rõ [ID: xxx] để có thể link đến
- Không bịa ra sản phẩm không có trong danh sách
- Tư vấn phối đồ từ các sản phẩm có sẵn
- Trả lời về giá, size, chất liệu dựa trên thông tin thực

CÁCH TRẢ LỜI:
- Ngắn gọn, thân thiện
- Đề xuất 2-3 sản phẩm cụ thể khi có thể
- Luôn ghi [ID: xxx] khi mention sản phẩm để user có thể xem
- Nếu hỏi về sản phẩm không có, gợi ý sản phẩm tương tự

VÍ DỤ: "Tôi recommend áo thun XYZ (350.000đ) [ID: abc123] và quần jeans ABC (500.000đ) [ID: def456] cho outfit casual."`,
                },
                { role: "user", content: message },
            ],
        });

        res.json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error('Chatbot error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi xử lý yêu cầu!" });
    }
});

module.exports = router;
