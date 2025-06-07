const Products = require('../../Models/product')
const Category = require('../../Models/category')
const Comment = require('../../Models/comment')
const Detail_Order = require('../../Models/detail_order')
const Order = require('../../Models/order')
const Sale = require('../../Models/sale')


module.exports.index = async (req, res) => {
    try {
        const products = await Products.find();
        const sales = await Sale.find({ status: true });
        
        // Create a map of product IDs to their sale information
        const salesMap = {};
        for (const sale of sales) {
            salesMap[sale.id_product] = {
                promotion: sale.promotion,
                saleId: sale._id
            };
        }
        
        // Add sale information to products
        const productsWithSaleInfo = products.map(product => {
            const productObj = product.toObject();
            if (salesMap[product._id.toString()]) {
                productObj.promotion = salesMap[product._id.toString()].promotion;
                productObj.saleId = salesMap[product._id.toString()].saleId;
            }
            return productObj;
        });
        
        res.json(productsWithSaleInfo);
    } catch (error) {
        console.error('Error fetching products with sale info:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu sản phẩm' });
    }
}


module.exports.gender = async (req, res) => {

    const gender = req.query.gender

    const category = await Category.find({ gender: gender })

    res.json(category)

}

//TH: Hàm này dùng để phân loại Product
module.exports.category = async (req, res) => {
    try {
        const id_category = req.query.id_category;
        const gender = req.query.gender;
        
        console.log("Category API Request Params:", { id_category, gender });
        
        let query = {};
        
        if (id_category && id_category !== 'all') {
            query.id_category = id_category;
        }
        
        if (gender) {
            // Chuyển đổi chuỗi tìm kiếm sang lowercase để so sánh không phân biệt hoa thường
            const genderLowercase = gender.toLowerCase();
            console.log("Searching for gender:", genderLowercase);
            
            // Kiểm tra giá trị gender và áp dụng điều kiện tìm kiếm phù hợp
            if (genderLowercase === 'male' || genderLowercase === 'female' || genderLowercase === 'unisex') {
                // Sử dụng regex để tìm kiếm không phân biệt hoa thường
                query.gender = { $regex: new RegExp(genderLowercase, 'i') };
            }
        }
        
        console.log("Final MongoDB Query:", JSON.stringify(query));
        
        // Tìm tất cả sản phẩm trong database
        const allProducts = await Products.find();
        console.log("Total products in database:", allProducts.length);
        
        // Kiểm tra trường gender trong database
        const genderCounts = {};
        allProducts.forEach(product => {
            const g = product.gender ? product.gender.toLowerCase() : 'undefined';
            genderCounts[g] = (genderCounts[g] || 0) + 1;
        });
        console.log("Gender distribution in database:", genderCounts);
        
        // Tìm sản phẩm theo query
        const products_category = await Products.find(query);
        console.log("Found products matching query:", products_category.length);
        
        // Nếu không tìm thấy sản phẩm nào và đang tìm theo gender, thử cách khác
        if (products_category.length === 0 && gender) {
            console.log("No products found with regex query, trying direct match");
            // Thử tìm trực tiếp bằng cách so sánh lowercase
            const filteredProducts = allProducts.filter(product => {
                return product.gender && product.gender.toLowerCase() === gender.toLowerCase();
            });
            
            if (filteredProducts.length > 0) {
                console.log("Found products with direct lowercase match:", filteredProducts.length);
                
                // Xử lý thông tin sale cho sản phẩm tìm thấy
                const sales = await Sale.find({ status: true });
                const salesMap = {};
                for (const sale of sales) {
                    salesMap[sale.id_product] = {
                        promotion: sale.promotion,
                        saleId: sale._id
                    };
                }
                
                const productsWithSaleInfo = filteredProducts.map(product => {
                    const productObj = product.toObject();
                    if (salesMap[product._id.toString()]) {
                        productObj.promotion = salesMap[product._id.toString()].promotion;
                        productObj.saleId = salesMap[product._id.toString()].saleId;
                    }
                    return productObj;
                });
                
                return res.json(productsWithSaleInfo);
            }
        }
        
        // Xử lý thông tin sale cho sản phẩm tìm thấy bằng query ban đầu
        const sales = await Sale.find({ status: true });
        
        // Create a map of product IDs to their sale information
        const salesMap = {};
        for (const sale of sales) {
            salesMap[sale.id_product] = {
                promotion: sale.promotion,
                saleId: sale._id
            };
        }
        
        // Add sale information to products
        const productsWithSaleInfo = products_category.map(product => {
            const productObj = product.toObject();
            if (salesMap[product._id.toString()]) {
                productObj.promotion = salesMap[product._id.toString()].promotion;
                productObj.saleId = salesMap[product._id.toString()].saleId;
            }
            return productObj;
        });
        
        res.json(productsWithSaleInfo);
    } catch (error) {
        console.error('Error fetching products by category with sale info:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu sản phẩm theo danh mục' });
    }
}

//TH: Chi Tiết Product
module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Products.findOne({ _id: id });
        
        if (!product) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }
        
        const sale = await Sale.findOne({ id_product: id, status: true });
        
        const productObj = product.toObject();
        if (sale) {
            productObj.promotion = sale.promotion;
            productObj.saleId = sale._id;
        }
        
        res.json(productObj);
    } catch (error) {
        console.error('Error fetching product detail:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy chi tiết sản phẩm' });
    }
}


// QT: Tìm kiếm phân loại và phân trang Product
module.exports.pagination = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const count = parseInt(req.query.count) || 9;
    const search = req.query.search || '';
    const category = req.query.category;
    const gender = req.query.gender;
    
    console.log("Received query params:", { page, count, search, category, gender });
    
    let query = {};
    
    if (category !== 'all') {
        query.id_category = category;
    }
    
    if (gender) {
        if (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female' || gender.toLowerCase() === 'unisex') {
            query.gender = { $regex: new RegExp('^' + gender + '$', 'i') };
        }
    }
    
    if (search) {
        query.name_product = { $regex: search, $options: 'i' };
    }
    
    console.log("Final query:", query);
    
    const products = await Products.find(query)
        .skip((page - 1) * count)
        .limit(count);
    
    console.log("Found products count:", products.length);
    
    res.json(products);
}

// Hàm này dùng để hiện những Product search theo scoll ở component tìm kiếm bên client
module.exports.scoll = async (req, res) => {

    const page = req.query.page
    
    const count = req.query.count

    const search = req.query.search

    //Lấy Product đầu và sẩn phẩm cuối
    const start = (page - 1) * count
    const end = page * count   

    const products = await Products.find()

    const newData = products.filter(value => {
        return value.name_product.toUpperCase().indexOf(search.toUpperCase()) !== -1
    })

    const paginationProducts = newData.slice(start, end)

    res.json(paginationProducts)

}

// Lấy danh sách sản phẩm mới nhất dựa trên ngày tạo
module.exports.getNewProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        
        const newProducts = await Products.find()
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
            .limit(limit);
        
        const sales = await Sale.find({ status: true });
        
        // Create a map of product IDs to their sale information
        const salesMap = {};
        for (const sale of sales) {
            salesMap[sale.id_product] = {
                promotion: sale.promotion,
                saleId: sale._id
            };
        }
        
        // Add sale information to products
        const productsWithSaleInfo = newProducts.map(product => {
            const productObj = product.toObject();
            if (salesMap[product._id.toString()]) {
                productObj.promotion = salesMap[product._id.toString()].promotion;
                productObj.saleId = salesMap[product._id.toString()].saleId;
            }
            return productObj;
        });
        
        res.json(productsWithSaleInfo);
    } catch (error) {
        console.error('Error getting new products:', error);
        res.status(500).json({ 
            error: 'Lỗi server khi lấy sản phẩm mới' 
        });
    }
};

// Lấy danh sách sản phẩm bán chạy nhất
module.exports.getBestSelling = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        
        // Lấy tất cả đơn hàng đã hoàn thành
        const completedOrders = await Order.find({ status: "4" });
        
        // Tạo map để đếm số lượng bán của mỗi sản phẩm
        const productSales = {};
        
        // Tính tổng số lượng bán cho mỗi sản phẩm
        for (const order of completedOrders) {
            const orderDetails = await Detail_Order.find({ 
                id_order: order._id.toString()
            });
            
            for (const detail of orderDetails) {
                const productId = detail.id_product;
                if (!productSales[productId]) {
                    productSales[productId] = 0;
                }
                productSales[productId] += detail.count;
            }
        }
        
        // Chuyển đổi map thành array để sắp xếp
        const sortedProducts = Object.keys(productSales).map(id => ({
            id: id,
            salesCount: productSales[id]
        }));
        
        // Sắp xếp theo số lượng bán giảm dần
        sortedProducts.sort((a, b) => b.salesCount - a.salesCount);
        
        // Lấy top sản phẩm bán chạy
        const topProductIds = sortedProducts.slice(0, limit).map(item => item.id);
        
        // Lấy thông tin chi tiết của các sản phẩm bán chạy
        const bestSellingProducts = await Products.find({
            _id: { $in: topProductIds }
        });
        
        // Lấy thông tin khuyến mãi từ Sale collection
        const sales = await Sale.find({ status: true });
        
        // Create a map of product IDs to their sale information
        const salesMap = {};
        for (const sale of sales) {
            salesMap[sale.id_product] = {
                promotion: sale.promotion,
                saleId: sale._id
            };
        }
        
        // Sắp xếp kết quả theo thứ tự bán chạy và thêm thông tin khuyến mãi
        const sortedResult = bestSellingProducts
            .sort((a, b) => {
                const aIndex = topProductIds.indexOf(a._id.toString());
                const bIndex = topProductIds.indexOf(b._id.toString());
                return aIndex - bIndex;
            })
            .map(product => {
                const productObj = product.toObject();
                if (salesMap[product._id.toString()]) {
                    productObj.promotion = salesMap[product._id.toString()].promotion;
                    productObj.saleId = salesMap[product._id.toString()].saleId;
                }
                return productObj;
            });
        
        res.json(sortedResult);
    } catch (error) {
        console.error('Error getting best selling products:', error);
        res.status(500).json({ 
            error: 'Lỗi server khi lấy sản phẩm bán chạy' 
        });
    }
};

// QT: Lấy thống kê đánh giá và số lượng đã bán cho sản phẩm
module.exports.getProductStats = async (req, res) => {
    try {
        const productId = req.params.id;
        console.log("Fetching stats for product:", productId);
        
        // Lấy thống kê đánh giá
        const comments = await Comment.find({ id_product: productId });
        console.log("Found comments:", comments.length);
        
        const averageRating = comments.length > 0 
            ? comments.reduce((sum, comment) => sum + comment.star, 0) / comments.length 
            : 0;
        
        // Lấy số lượng đã bán từ các đơn hàng đã hoàn thành (status = 4)
        const completedOrders = await Order.find({ status: "4" });
        console.log("Found completed orders:", completedOrders.length);
        
        let totalSold = 0;
        for (const order of completedOrders) {
            const orderDetails = await Detail_Order.find({ 
                id_order: order._id.toString(),
                id_product: productId 
            });
            
            for (const detail of orderDetails) {
                totalSold += detail.count;
            }
        }
        
        console.log("Stats result:", { productId, averageRating, totalReviews: comments.length, totalSold });
        
        res.json({
            productId: productId,
            averageRating: Math.round(averageRating * 10) / 10, // Làm tròn 1 chữ số
            totalReviews: comments.length,
            totalSold: totalSold
        });
        
    } catch (error) {
        console.error('Error getting product stats:', error);
        res.status(500).json({ 
            error: 'Lỗi server khi lấy thống kê sản phẩm' 
        });
    }
};

// Lấy các sản phẩm tương tự
module.exports.getSimilarProducts = async (req, res) => {
    try {
        const productId = req.params.id;
        const limit = parseInt(req.query.limit) || 8;
        
        // Lấy thông tin sản phẩm hiện tại
        const currentProduct = await Products.findOne({ _id: productId });
        if (!currentProduct) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }

        // Lấy các sản phẩm cùng category và gender
        let similarProducts = await Products.find({
            _id: { $ne: productId },
            $or: [
                { id_category: currentProduct.id_category, gender: currentProduct.gender },
                { id_category: currentProduct.id_category },
                { gender: currentProduct.gender }
            ]
        }).limit(limit);
        
        // Nếu không đủ sản phẩm, lấy thêm các sản phẩm ngẫu nhiên
        if (similarProducts.length < 4) {
            const remainingProducts = await Products.find({
                _id: { $ne: productId },
                _id: { $nin: similarProducts.map(p => p._id) }
            }).limit(4 - similarProducts.length);
            
            similarProducts = [...similarProducts, ...remainingProducts];
        }
        
        // Lấy thông tin khuyến mãi cho các sản phẩm
        const sales = await Sale.find({ status: true });
        
        // Create a map of product IDs to their sale information
        const salesMap = {};
        for (const sale of sales) {
            salesMap[sale.id_product] = {
                promotion: sale.promotion,
                saleId: sale._id
            };
        }
        
        // Add sale information to products
        const productsWithSaleInfo = similarProducts.map(product => {
            const productObj = product.toObject();
            if (salesMap[product._id.toString()]) {
                productObj.promotion = salesMap[product._id.toString()].promotion;
                productObj.saleId = salesMap[product._id.toString()].saleId;
            }
            return productObj;
        });
        
        res.json(productsWithSaleInfo);
    } catch (error) {
        console.error('Error getting similar products:', error);
        res.status(500).json({ 
            error: 'Lỗi server khi lấy sản phẩm tương tự' 
        });
    }
};
