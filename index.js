require('dotenv').config();
const cloudinary = require("cloudinary").v2;
const express = require('express')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);

const cors = require("cors");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// Khởi tạo paypal
var paypal = require('paypal-rest-sdk');

var upload = require('express-fileupload');
const port = 8000

const ProductAPI = require('./API/Router/product.router')
const UserAPI = require('./API/Router/user.router')
const OrderAPI = require('./API/Router/order.router')
const Detail_OrderAPI = require('./API/Router/detail_order.router')
const CommentAPI = require('./API/Router/comment.router')
const CategoryAPI = require('./API/Router/category.router')
const NoteAPI = require('./API/Router/note.router')
const ChatbotAPI = require('./API/Router/chatbot.router')
const FeatureAPI = require('./API/Router/feature.router.js');
const CartAPI = require('./API/Router/cart.router.js');
const FavoriteAPI = require('./API/Router/favorite.router');

const ProductAdmin = require('./API/Router/admin/product.router')
const CategoryAdmin = require('./API/Router/admin/category.router')
const Permission = require('./API/Router/admin/permission.router')
const UserAdmin = require('./API/Router/admin/user.router')
const Order = require('./API/Router/admin/order.router')
const Coupon = require('./API/Router/admin/coupon.router')
const Sale = require('./API/Router/admin/sale.router')
const CommentAdmin = require('./API/Router/admin/comment.router')

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to database ');

  // Tự động tạo quyền Admin nếu chưa tồn tại
  try {
    const Permission = require('./Models/permission');
    const adminPermission = await Permission.findOne({ permission: 'Admin' });
    if (!adminPermission) {
      const newAdminPermission = new Permission({ permission: 'Admin' });
      await newAdminPermission.save();
      console.log('Created Admin permission');
    }
  } catch (error) {
    console.error('Error creating Admin permission:', error);
  }
})
  .catch((err) => {
    console.error(`Error connecting to the database. \n${err}`);
  });


app.use('/', express.static('public'))
app.use(upload());

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

// Cài đặt config cho paypal
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

app.use('/api/Product', ProductAPI)
app.use('/api/User', UserAPI)
app.use('/api/Feature', FeatureAPI);
app.use('/api/Cart', CartAPI);
app.use('/api/Favorite', FavoriteAPI); // Fixed favorite router

app.use('/api/Payment', OrderAPI)
app.use('/api/Comment', CommentAPI)
app.use('/api/Note', NoteAPI)
app.use('/api/DetailOrder', Detail_OrderAPI)
app.use('/api/Category', CategoryAPI)
app.use('/api/Chatbot', ChatbotAPI)

app.use('/api/admin/Product', ProductAdmin)
app.use('/api/admin/Category', CategoryAdmin)
app.use('/api/admin/Permission', Permission)
app.use('/api/admin/user', UserAdmin)
app.use('/api/admin/Order', Order)
app.use('/api/admin/Coupon', Coupon)
app.use('/api/admin/Sale', Sale)
app.use('/api/admin/comment', CommentAdmin)


io.on("connection", (socket) => {
  console.log(`Có người vừa kết nối, socketID: ${socket.id}`);


  socket.on('send_order', (data) => {
    console.log(data)

    socket.broadcast.emit("receive_order", data);
  })
})
app.get("/ping", (req, res) => {
  res.send("pong");
});

http.listen(port, () => {
  console.log('listening on *: ' + port);
});


