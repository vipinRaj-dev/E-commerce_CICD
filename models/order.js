const mongoose = require("mongoose");
const userModel = require('./usermodel');


    const orderSchema = new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: userModel
        },
        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: userModel
        },
        status: {
            type: String,
            default: "Processing"
        },
        orderCancleRequest: {
            type: Boolean,
            default: false
        },
        orderReturnRequest: {
            type: Boolean,
            default: false
        },
        productdetails: [{
            p_name: {
                type: String,
                require: true
            },
            realPrice: {
                type:Number,
                require: true
            },
            price: {
                type: Number,
                require: true
            },
            totalPrice:{
                type :Number
            },
            description: {
                type: String,
                require: true
            },
            image: [{
                type: String,
                require: true
            }],
            category: [{
                type: String,
                require: true
            }],
            quantity: {
                type: Number,
                require: true
            },
            cancelProduct :{
                type : Boolean,
                default:false
            },
            returnProduct :{
                type:Boolean,
                default:false
            }
        }],
        payment: {
            method: {
                type: String,
            },
            amount: {
                type: Number,
            },
            transactionId:{
                type:String
            }
        },
        couponDetails:{
            couponName:{
                type:String
            },
            couponAmount:{
                type:Number
            }
        },
        createdAt: {
            type: Date,
            immutable: true,
            default: () => Date.now()
        },
        expectedDelivery: {
            type: Date,
        }
    });

const orderModel = mongoose.model('order', orderSchema);
module.exports = orderModel;
