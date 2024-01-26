const express = require('express')

const user_route = express.Router()


const userController = require('../api/services/user-controllers')
const profilecontrollers = require('../api/services/profile-controllers')

const userAuth = require('../middleware/userAuth')


//get home
user_route.get('/',userController.home) 

    



//signup
user_route.get('/signup',userController.signup)
user_route.post('/signup',userController.signup_post)
user_route.post('/otp-signupValidation',userController.signup_Otpvalidation)

//resend otp
user_route.get('/resendOtp',userController.resendOtp)


// login
user_route.get('/login',userController.login)
user_route.post('/login',userController.login_post)
user_route.post('/otp-loginValidation',userController.login_OTPValidation)

//single page view 
user_route.get('/product-view/:id',userController.productView)


//search products
user_route.post('/search',userAuth.isblock,userController.search_product)


//shop
user_route.get('/shop',userAuth.isblock,userAuth.userChecking,userController.shop)


//filtering products
user_route.post('/filter',userAuth.userChecking, userController.filter)


//cart
user_route.post('/cart/:id',userAuth.userChecking,userAuth.isblock,userController.Addcart)
user_route.get('/cart',userAuth.userChecking,userAuth.isblock,userController.loadcart)
user_route.post('/cart/quantityUpdate/:itemId', userController.cartQuantityUpdate);
user_route.post('/cartDelete/:id', userController.cartDelete);

//checkout page
user_route.get('/CheckOutPage',userAuth.isblock,userController.Checkout)
user_route.post('/AddressUpdate',userController.addressAdding)
user_route.post('/CheckOut',userAuth.isblock,userController.orderSuccess)


user_route.post('/saveOrderData',userController.savingData)

 
 
//profile details
user_route.get('/profile',userAuth.isblock,profilecontrollers.profile)
user_route.get('/profile/order',userAuth.isblock,profilecontrollers.order)   
user_route.post('/profile/orderStatus/:id',userAuth.isblock,profilecontrollers.orderStatus)
user_route.post('/profile/order/:id',profilecontrollers.orderCancel)

user_route.get('/profile/orderCancel',profilecontrollers.productCancel)

user_route.get('/success',profilecontrollers.successTick)

user_route.get('/profile/invoice',userAuth.isblock,profilecontrollers.pdf)


//wishlist
user_route.get('/wishlist',userAuth.isblock,userController.WhishListLoad)

user_route.post('/wishlist/:id',userController.addingWhishList)

user_route.post('/wishlist/cart/:id',userAuth.isblock,userController.addingWhishListtoCart)

user_route.get('/wishlist/:id',userController.WhishProductDelete)



//wallet
user_route.get('/profile/wallet',userAuth.isblock,profilecontrollers.loadWallet)

user_route.post('/profile/topup',userAuth.isblock,profilecontrollers.topUpWallet)

user_route.post('/profile/verify-topup',userAuth.isblock,profilecontrollers.verifyTopUp)

user_route.get('/profile/wallet_history',userAuth.isblock,profilecontrollers.loadWalletHistory)



//coupens
user_route.post('/coupons/couponValidation',userAuth.isblock,userController.coupons)

//profile address updation
user_route.get('/profile/address',userAuth.isblock,profilecontrollers.profileAddress)
user_route.post('/profile/address/editAddress',userAuth.isblock,profilecontrollers.editAddress)
user_route.post('/profile/address/updateAddress',userAuth.isblock,profilecontrollers.updateaddress)
user_route.post('/profileUpdate',profilecontrollers.profileUpdate)


//logout
user_route.get('/logout',userController.signout)


//return
user_route.get('/profile/orderReturn',userAuth.isblock,profilecontrollers.listReturn)
user_route.post('/profile/orderReturn/:id',userAuth.isblock,profilecontrollers.orderReturn)








module.exports = user_route

    
