
// brocamp mini project
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose')
const session = require('express-session')
const { v4: uuid4 } = require("uuid");
const app = express();
const dotenv = require('dotenv')

//multer image path
app.use('/productImages', express.static(path.resolve(__dirname, 'productImages')));

//multer image for banners
app.use('/banner',express.static(path.resolve(__dirname,'banner')))

dotenv.config({path:path.join(__dirname,'config/config.env')})

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT =3000;

//mongodb connection
mongoose.connect('mongodb://mongo:27017/ecommerce') 
  .then(() => {
    console.log("mongodb connected")
  })
  .catch(() => {
    console.log("connection failed");
  }); 

//session handling
const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: uuid4(),
    resave: false,
    cookie: { maxAge: oneDay },
    saveUninitialized: true, 
  })
);


//cachecontrol
app.use( (req, res, next)=>{
    if (!req.user)
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
  });


//getting the routes
const adminRouter = require('./routes/admin')
const userRouter = require('./routes/user')


  

// view engine setup
app.set('views', 'views');
app.set('view engine', 'ejs');
//morgan
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

//routing
app.use('/',userRouter)
app.use('/admin', adminRouter);








app.listen(PORT, () => {
    console.log(`running on port ${PORT}`);
  })