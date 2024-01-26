const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    productID: {
        type: String,
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
    },
    originalprice:{
        type: String,
        require:true,
    },
    discription: {
        type: String, 
        required: true
    },
    image: [{ 
        type: String,
        require: true
    }],
    category: {
        type: String,
        required: true,
        
    },
    productOffer:{
        type:String,
        required:true,
    },
    quantity: {
        type: String,
        
    },
    availability: {
        type: Boolean,
        default: true,
    },
    softdelete:{
        type:Boolean,
        default:true,
    }
})
const productCollection = new mongoose.model("productdata", productSchema);


module.exports = productCollection;


