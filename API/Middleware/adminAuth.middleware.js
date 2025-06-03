const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Kiểm tra nếu thông tin đăng nhập khớp với biến môi trường
        if (email === process.env.ADMIN_EMAIL) {
            // Nếu là admin từ biến môi trường
            if (password === process.env.ADMIN_PASSWORD) {
                // Tìm quyền Admin trong cơ sở dữ liệu
                const adminPermission = await mongoose.model('Permission').findOne({ permission: 'Admin' });
                
                if (!adminPermission) {
                    // Nếu không tìm thấy quyền Admin, tạo mới
                    const Permission = mongoose.model('Permission');
                    const newAdminPermission = new Permission({ permission: 'Admin' });
                    await newAdminPermission.save();
                    
                    // Tạo token JWT với quyền admin mới
                    const token = jwt.sign(
                        { 
                            userId: 'admin',
                            isEnvAdmin: true,
                            permissionId: newAdminPermission._id
                        }, 
                        process.env.JWT_SECRET || 'gfdgfd', 
                        { expiresIn: '1h' }
                    );
                    
                    return res.json({
                        msg: "Đăng nhập thành công",
                        user: {
                            _id: 'admin',
                            email: process.env.ADMIN_EMAIL,
                            fullname: process.env.ADMIN_FULLNAME || 'Administrator',
                            username: process.env.ADMIN_USERNAME || 'admin',
                            id_permission: newAdminPermission._id
                        },
                        jwt: token
                    });
                } else {
                    // Sử dụng quyền Admin đã tồn tại
                    const token = jwt.sign(
                        { 
                            userId: 'admin',
                            isEnvAdmin: true,
                            permissionId: adminPermission._id
                        }, 
                        process.env.JWT_SECRET || 'gfdgfd', 
                        { expiresIn: '1h' }
                    );
                    
                    return res.json({
                        msg: "Đăng nhập thành công",
                        user: {
                            _id: 'admin',
                            email: process.env.ADMIN_EMAIL,
                            fullname: process.env.ADMIN_FULLNAME || 'Administrator',
                            username: process.env.ADMIN_USERNAME || 'admin',
                            id_permission: adminPermission._id
                        },
                        jwt: token
                    });
                }
            }
        }
        
        // Nếu không phải admin từ biến môi trường, chuyển tiếp đến xử lý đăng nhập thông thường
        next();
    } catch (error) {
        console.error('Lỗi trong adminAuth middleware:', error);
        res.status(500).json({ msg: "Lỗi server" });
    }
};

module.exports.verifyEnvAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Không có token xác thực' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gfdgfd');
        
        // Kiểm tra nếu là admin từ biến môi trường
        if (decoded.isEnvAdmin) {
            req.user = decoded;
            return next();
        }
        
        // Nếu không phải, chuyển tiếp đến xử lý xác thực thông thường
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

