const Users = require('../../Models/user')
const bcrypt = require('bcrypt'); // Thêm bcrypt

module.exports.index = async (req, res) => {

    const user = await Users.find()

    res.json(user)

}

module.exports.user = async (req, res) => {

    const id = req.params.id

    const user = await Users.findOne({ _id: id })

    res.json(user)

}

module.exports.detail = async (req, res) => {
    try {
        const username = req.query.username
        const password = req.query.password

        const query = [{ username: username }, { email: username }]
        const user = await Users.findOne({ $or: query })

        if (user === null) {
            res.send("Khong Tìm Thấy User")
        } else {
            // So sánh mật khẩu nhập vào với mật khẩu đã băm
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (isMatch) {
                res.json(user)
            } else {
                res.send("Sai Mat Khau")
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi server");
    }
}

module.exports.post_user = async (req, res) => {
    try {
        // Kiểm tra username đã tồn tại chưa
        const userByUsername = await Users.findOne({ username: req.body.username });
        if (userByUsername) {
            return res.send("User Da Ton Tai");
        }

        // Kiểm tra email đã tồn tại chưa
        if (req.body.email) {
            const userByEmail = await Users.findOne({ email: req.body.email });
            if (userByEmail) {
                return res.send("Email Da Ton Tai");
            }
        }

        // Kiểm tra số điện thoại đã tồn tại chưa
        if (req.body.phone) {
            const userByPhone = await Users.findOne({ phone: req.body.phone });
            if (userByPhone) {
                return res.send("Phone Da Ton Tai");
            }
        }

        // Băm mật khẩu trước khi lưu vào database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        // Tạo user mới với mật khẩu đã băm
        const newUser = {
            ...req.body,
            password: hashedPassword
        };
        
        await Users.create(newUser);
        res.send("Thanh Cong");
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi server");
    }
}

module.exports.update_user = async (req, res) => {
    try {
        const user = await Users.findOne({ _id: req.body._id});
        
        if (!user) {
            return res.status(404).send("Khong Tim Thay User");
        }

        // Kiểm tra email trùng lặp (nếu thay đổi email)
        if (req.body.email && req.body.email !== user.email) {
            const existingEmailUser = await Users.findOne({ 
                email: req.body.email,
                _id: { $ne: req.body._id } // Exclude current user
            });
            if (existingEmailUser) {
                return res.send("Email Da Ton Tai");
            }
        }

        // Kiểm tra phone trùng lặp (nếu thay đổi phone)
        if (req.body.phone && req.body.phone !== user.phone) {
            const existingPhoneUser = await Users.findOne({ 
                phone: req.body.phone,
                _id: { $ne: req.body._id } // Exclude current user
            });
            if (existingPhoneUser) {
                return res.send("Phone Da Ton Tai");
            }
        }

        // Cập nhật thông tin
        const updateData = {
            fullname: req.body.fullname || user.fullname,
            username: user.username, // Username không thay đổi
            email: req.body.email || user.email,
            phone: req.body.phone || user.phone,
            gender: req.body.gender || user.gender,
            id_permission: req.body.id_permission || user.id_permission
        };
        
        // Chỉ cập nhật mật khẩu nếu có mật khẩu mới
        if (req.body.password && req.body.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }

        await Users.updateOne({ _id: req.body._id }, updateData);
        res.send("Thanh Cong");
    } catch (error) {
        console.error(error);
        res.status(500).send("Loi Server");
    }
}
