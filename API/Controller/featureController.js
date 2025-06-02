const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const extractFeature = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file được gửi.' });
        }

        const filePath = req.file.path;

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const response = await axios.post('http://localhost:8000/extract-features/', form, {
            headers: form.getHeaders(),
        });

        // Xoá ảnh tạm
        fs.unlinkSync(filePath);

        return res.json({
            feature_vector: response.data.feature_vector,
        });
    } catch (err) {
        console.error('Lỗi extractFeature:', err);
        return res.status(500).json({ error: 'Lỗi trong quá trình trích xuất đặc trưng ảnh.' });
    }
};
module.exports = {
    extractFeature,
};
