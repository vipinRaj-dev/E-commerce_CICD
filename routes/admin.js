var express = require('express');
var admin_router = express.Router();
// const session = require("express-session");
// const nocache = require("nocache");
// const multer =require('multer')
 
const admincontroller = require('../api/services/admin-controllers')

const adminauth = require('../middleware/adminauth');
const multermiddleware = require('../middleware/multer')
 


  


  

//admin dashboard 
admin_router.get('/dashboard',adminauth.isAdmin,admincontroller.dashboard)
admin_router.post('/dashboard/graph',admincontroller.graph)
admin_router.post('/dashboard/graphcategory',admincontroller.graphcategory)
admin_router.post('/dashboard/productCountGraph',admincontroller.productCountGraph)
admin_router.get('/dashboard/salesReport',adminauth.isAdmin,admincontroller.salesReport)

// admin_router.post('/Pdf',admincontroller.salesReportPdf)



//admin entry and exit
admin_router.get('/login',adminauth.isAdmin,admincontroller.login)
admin_router.post('/login',admincontroller.login_post)
admin_router.get('/signout',admincontroller.adminLogout)


//products routes
admin_router.get('/view-product', adminauth.isAdmin,admincontroller.products)
admin_router.get('/add-product', admincontroller.add_product)


admin_router.post('/add-product',multermiddleware.upload.array('image'),admincontroller.add_product_post)
admin_router.get('/edit-product/:id',admincontroller.edit_product)

admin_router.post('/edit-product',multermiddleware.upload.array('image'),admincontroller.editproduct_post)
admin_router.post('/product-search',admincontroller.search_product)
admin_router.get('/deleteProduct/:id',admincontroller.productDelete)
admin_router.post('/p_unlist/:id',admincontroller.prodUnlist)
admin_router.post('/p_list/:id',admincontroller.prodlist)






//users routes 
admin_router.get('/users', admincontroller.users)
admin_router.post('/user-search',admincontroller.user_search)
admin_router.post('/user-blocking', admincontroller.userblocking)
admin_router.post('/user-unblocking', admincontroller.userUnBlocking)



//category routes
admin_router.get('/category', admincontroller.category)
admin_router.get('/create-category', admincontroller.create_category)
admin_router.post('/create-category', admincontroller.create_category_post)
admin_router.get('/edit-category', admincontroller.edit_categories)
admin_router.post('/category-edit',admincontroller.categoryEditpost)
admin_router.post('/unlistCategory/:id',admincontroller.unlistCategory)
admin_router.post('/listCategory/:id',admincontroller.listCategory)




//order details
admin_router.get('/order',admincontroller.orderList)
admin_router.post('/order/details',admincontroller.orderDetails)
admin_router.put('/order/:id',admincontroller.orderstatus)


//coupen 

admin_router.get('/coupons',admincontroller.couponsList)
admin_router.get('/coupons/couponsAdding',admincontroller.couponsAdding)
admin_router.post('/coupons/couponsAdding',admincontroller.couponCreation)
admin_router.post('/coupons/couponsRemove/:id',admincontroller.couponsRemove)

//banner
admin_router.get('/banners',admincontroller.banner)
admin_router.get('/add-banner',admincontroller.add_banner)
admin_router.post('/banners',multermiddleware.update.array('image'),admincontroller.add_bannerPost)
admin_router.post('/bannerRemove/:id',admincontroller.bannerRemove)



module.exports = admin_router;