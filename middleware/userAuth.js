const userCollection = require("../models/usermodel");

// const productModel = require('../models/productmodel')



const isblock = async (req,res,next) => {
    try{
      console.log('isblocked is actually worked');
      if(req.session.user){
        console.log('man is worked ');
        // const email = req.body.email
        const email = req.session.user
        const check = await userCollection.findOne({ email:email });
        if(check.isblocked === false){
          next();
      }else{
        console.log('man is worked ');

         req.session.user = null
          res.render('user/login',{user,message:"Please contact Your Admin You are no longer to access this account"})
        
      }
     
      }
     
    }catch(err){
      console.log(err.message);
    }
   
  }


  const userChecking = (req,res,next)=>{
    if(req.session.user){
      next()
    }else{
      res.redirect('/login')
    }
  }
  

    
  module.exports = {
    isblock,
    userChecking,
  };
  