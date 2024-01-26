const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
        categoryID :{
            type : String,
        },
        categoryName :{
            type : String,
            unique:true,
            required : true
        },
        categoryDescription :{
            type : String,
            required : true
        },
        categoryDiscount:{
            type:Number,
            default:0
        },

       isavilable:{
        type:Boolean,
        default:true
       }
        
})

 const categoryCollection = new mongoose.model("categorydata",categorySchema);


module.exports = categoryCollection;


