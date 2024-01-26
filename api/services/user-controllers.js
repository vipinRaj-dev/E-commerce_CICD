const categoryCollection = require("../../models/categorymodel");
const productCollection = require("../../models/productmodel");
const usercollection = require("../../models/usermodel");
const otpcollection = require("../../models/otpmodel");
const couponcollection = require("../../models/coupon");
const ordercollection = require("../../models/order");
const bannercollection = require("../../models/banners");
const { Twilio } = require("twilio");
const Razorpay = require("razorpay");
const { v4: uuid4 } = require("uuid");

const bcrypt = require("bcrypt");

const key_id = process.env.key_id;
const key_secret = process.env.key_secret;

const fast2sms = require("fast-two-sms");
const API =
  "FONkjetDrTbMoQXPy2fm5YS84BRawh3s9cUAC0zl6pHqJdZv1KxzTR8oCsfw50VaWnYDGJA71FOPcKdp";

const twilioPhoneNumber = "+14708656232";
const accountSid = "AC2380c94559b069fb10731d3a0ffb521e";
const authToken = "dc1a677b6a90e5595c806faac194707c";

const client = new Twilio(accountSid, authToken);

//hashing the passsword
const pwdEncription = (password) => {
  const hasheNdPWD = bcrypt.hash(password, 10);
  return hasheNdPWD;
};

//signup get
const signup = (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("user/signup", { success: "", succ: "", exist: "" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// signup post using the fast2sms

const signup_post = async (req, res) => {
  try {
    const entrie = 1;
    const enpwd = await pwdEncription(req.body.password);
    req.body.password = enpwd;
    req.body.isblocked = false;
    let cartCount;
    const Referal = req.body.referalCode;

    if (Referal) {
      await usercollection.findOneAndUpdate(
        { "referalCode.code": Referal, "referalCode.count": { $lte: 5 } },
        { $inc: { walletbalance: 100, "referalCode.count": 1 } }
      );
    }

    const { name, email, mobile, password, isblocked } = req.body;

    const referralCode = uuid4();

    req.session.userData = {
      name: name,
      email: email,
      mobile: mobile,
      password: password,
      isblocked: isblocked,
      referalCode: {
        code: referralCode,
        count: 0,
      },
    };

    const checkname = await usercollection.findOne({
      $or: [{ email: req.body.email }, { mobile: req.body.mobile }],
    });

    if (!checkname) {
      //otp generator normal console
      try {
        let randomOTP = Math.floor(Math.random() * 9000) + 1000;
        console.log('This is your login OTP:', randomOTP);

        // Save the random OTP number to the database
        // const newUser = new otpcollection({
        //     number: randomOTP
        // });

        // await newUser.save();

        // res.render('user/validation', {cartCount, entrie });

        // const randome = Math.floor(Math.random() * 9000) + 1000;
        // console.log(randome);

        // Send the OTP using Twilio
        // client.messages
        //   .create({
        //     body: `Your verification OTP is: ${randome}`,
        //     from: twilioPhoneNumber,
        //     to: "+917902992374",
        //   })
        //   .then(() => {
        //     saveUser();
        //   })
        //   .catch((error) => {
        //     console.error("Error sending SMS:", error);
        //   });

        function saveUser() {
          const newUser = new otpcollection({
            number: randomOTP,
          });
          newUser
            .save()
            .then(() => {
              res.render("user/validation", {
                user: req.session.user,
                cartCount,
                entrie,
              });
            })
            .catch((error) => {
              console.log("error generating number", error);
            });
        }
      } catch (error) {
        console.log("Error generating OTP:", error);
        res.status(500).send("OTP error");
        const message = error.message;
        res.status(500).render("404-error", { error, message });
      }
      saveUser()

    } else {
      const user = true;
      res.render("user/signup", {
        exist: "email or mobile already exist",
        user,
      });
    }
  } catch (error) {
    console.log(error.message);
    let cartCount;
    // res.render('user/signUp', { succ: "Please Use a Uniqe Email ID and Phone Number", user: req.session.user, cartCount })
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

//signup post using the twilio

// const signup_post = async (req, res) => {
//     try {
//         const entrie = 1;
//         const enpwd = await pwdEncription(req.body.password);
//         req.body.password = enpwd;
//         req.body.isblocked = false;
//         let cartCount;
//
//         const { name, email, mobile, password, isblocked } = req.body;
//         req.session.userData = {
//             name: name,
//             email: email,
//             mobile: mobile,
//             password: password,
//             isblocked: isblocked,
//         };

//

//         const checkname = await usercollection.findOne({ $or: [{ email: req.body.email }, { mobile: req.body.mobile }] });

//

//         if (!checkname) {
//             const randome = Math.floor(Math.random() * 9000) + 1000;
//             console.log(randome);

//             // Send the OTP using Twilio
//             client.messages
//                 .create({
//                     body: `Your verification OTP is: ${randome}`,
//                     from: twilioPhoneNumber,
//                     to: '+917902992374',
//                 })
//                 .then(() => {
//                     saveUser();
//                 })
//                 .catch((error) => {
//                     console.error("Error sending SMS:", error);
//                 });

//             function saveUser() {
//                 const newUser = new otpcollection({
//                     number: randome
//                 });
//                 newUser.save()
//                     .then(() => {
//                         res.render('user/validation', { user: req.session.user, cartCount, entrie });
//                     })
//                     .catch((error) => {
//                         console.log("error generating number", error);
//                     });
//             }
//         } else {
//             const user = true;
//             res.render('user/signup', { exist: 'email or mobile already exist', user });
//         }

//     } catch (error) {
//         console.log(error.message);
//         let cartCount;
//         const message = error.message;
//         res.render('404-error', { error, message });
//     }
// };

// otp validation

const signup_Otpvalidation = async (req, res) => {
  try {
    const num1 = req.body.num_1;
    const num2 = req.body.num_2;
    const num3 = req.body.num_3;
    const num4 = req.body.num_4;
    const code = parseInt(num1 + num2 + num3 + num4);

    const foundOtp = await otpcollection.findOneAndDelete({ number: code });

    if (foundOtp) {
      const succ = "Successfully Created Your Account";
      await usercollection.create(req.session.userData);
      res.render("user/successtic", { user: req.session.userData, succ });
    } else {
      res.render("user/validation", {
        fail: "Please Check Your OTP",
        user: req.session.userData,
      });
    }
  } catch (error) {
    console.log("error from the signup_Otpvalidation:" + error);
    const message = error.message;
    res.status(500).render("404-error", { error, message });
  }
};

//get login
const login = (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("user/login");
    }
  } catch (error) {
    console.log(error.message);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

//login post

const login_post = async (req, res) => {
  try {
    console.log(" i am the login post");

    const userdata = await usercollection.findOne({ email: req.body.Email });

    if (userdata === null) {
      res.render("user/login", { errmsg: "user credentials invalid" });
    } else {
      isvalid = userdata.isblocked;
      if (isvalid === true) {
        res.render("user/login", {
          blockmsg:
            "Please Contact Your Admin You are not Allow to Use this Account AnyMore",
        });
      } else {
        let entrie = 0;
        const vpsw = await bcrypt.compare(req.body.Password, userdata.password);
        if (userdata.email === req.body.Email && vpsw === true) {
          const usernumber = userdata.mobile;
          const number = usernumber;
          let cartCount;

          //-------------add this to remove the otp validation
          req.session.user = userdata.email
          console.log(req.session.user);
          res.redirect('/')

          //-----------add this to add the otp validation

          req.session.data = userdata.email;
          // otp generator
          try {
            let entrie = 0;
            let randomOTP = Math.floor(Math.random() * 9000) + 1000;
            console.log('This is your login OTP:', randomOTP);

            // // Save the random OTP number to the database
            const newUser = new otpcollection({
              number: randomOTP
            });

            await newUser.save();

            res.render('user/validation', { user: req.session.user, cartCount, entrie });
          } catch (error) {
            console.log("Error generating OTP:", error);
            res.status(500).send("OTP error");
            const message = error.message;
            res.status(500).render('404-error', { error, message });
          }

          //------------------otp validation till this

          //twilio
          // let randomOTP = Math.floor(Math.random() * 9000) + 1000;
          // console.log("This is your login OTP:", randomOTP);
          // client.messages

          //   .create({
          //     body: `Your login verification OTP is: ${randomOTP}`,
          //     from: twilioPhoneNumber,
          //     to: "+917902992374",
          //   })
          //   .then(() => {
          //     saveUser();
          //   })
          //   .catch((error) => {
          //     console.error("Error sending SMS:", error);
          //   });

          function saveUser() {
            const newUser = new otpcollection({
              number: randomOTP,
            });
            newUser
              .save()
              .then(() => {
                res.render("user/validation", {
                  user: req.session.user,
                  cartCount,
                  entrie,
                });
              })
              .catch((error) => {
                console.log("error generating number", error);
              });
          }
        } else {
          console.log(" i am the login post error");
          const cart = userdata.cart.items;
          const cartCount = cart.length;
          res.render("user/login", { errmsg: "Check your password" });
        }
      }
    }
  } catch (error) {
    console.log(error.message);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

//otp validation login

const login_OTPValidation = async (req, res) => {
  let cartCount;
  try {
    const num1 = req.body.num_1;
    const num2 = req.body.num_2;
    const num3 = req.body.num_3;
    const num4 = req.body.num_4;
    const enteredOtp = parseInt(num1 + num2 + num3 + num4);
    const userEmail = req.session.data;
    await otpcollection
      .find({ number: enteredOtp })
      .then((found) => {
        let entrie = 0;
        if (found.length > 0) {
          req.session.user = userEmail;
          const succ = "Successfully Logged In";
          let cartCount;
          res.render("user/successtic", {
            user: req.session.user,
            cartCount,
            succ,
          });
          // IF FOUND, DELETE THE OTP CODE FROM DB
          otpcollection
            .findOneAndDelete({ number: enteredOtp })
            .then(() => {
              console.log("otp successfully deleted");
            })
            .catch((err) => {
              console.log("error while deleting", err);
            });
        } else {
          res.render("user/validation", {
            msg: "Wrong OTP Re-enter the OTP",
            user: req.session.user,
            cartCount,
            entrie,
          });
        }
      })
      .catch((err) => {
        let entrie = 0;
        console.log(
          "an error occured while fetching the otp from database in login post",
          err
        );
        res.render("user/validation", { msg: "use only number", entrie });
      });
  } catch (error) {
    console.log(error);
    res.status(500).send("Otp error");
    const message = error.message;
    res.status(500).render("404-error", { error, message });
  }
};

//resend otp

const resendOtp = async (req, res) => {
  //   otp generator

  try {
    let randomOTP = Math.floor(Math.random() * 9000) + 1000;
    console.log("This is your resend OTP:", randomOTP);
    let entrie = 0;

    // Save the random OTP number to the database
    const newUser = new otpcollection({
      number: randomOTP,
    });

    await newUser.save();

    res.render("user/validation", { user: req.session.user, entrie });
  } catch (error) {
    console.log("Error generating OTP:", error);
    res.status(500).send("OTP error");
    const message = error.message;
    res.status(500).render("404-error", { error, message });
  }
};

//logout user
const signout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        res.send("Error");
      } else {
        res.redirect("/");
      }
    });
  } catch (error) {
    console.log(err);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

//get home
const home = async (req, res) => {
  try {
    console.log("hello man i am the home page ");
    const products = await productCollection
      .find({ $and: [{ availability: true }, { softdelete: true }] })
      .limit(10);
    const product = await productCollection
      .find({ $and: [{ availability: true }, { softdelete: true }] })
      .skip(10)
      .limit(10);
    const bannerData = await bannercollection.find();

    if (req.session.user) {
      const useremail = req.session.user;

      const userdetials = await usercollection.findOne({ email: useremail });
      const name = userdetials.name;
      const whish_count = userdetials.wishlist.length;

      const cart = userdetials.cart.items;
      const cartCount = cart.length;
      user = true;
      res.render("user/home", {
        products,
        user,
        cartCount,
        name,
        product,
        whish_count,
        bannerData,
      });
    } else {
      console.log("this is home else condition");
      user = false;
      res.render("user/home", { user, products, product, bannerData });
    }
  } catch (error) {
    console.log("error from the home page" + error.message);
    const message = error.message;
    res.status(500).send("internal error");
    res.status(500).render("404-error", { error, message });
  }
};

//single product view get
const productView = async (req, res) => {
  console.log(" hi i am product view page");
  try {
    const id = req.params.id;
    const useremail = req.session.user;
    const userdata = await usercollection.findOne({ email: useremail });
    let name = "";
    let cartCount = 0;

    if (userdata !== null) {
      name = userdata.name;
      cartCount = userdata.cart.items?.length ?? 0;
    }

    const data = await productCollection.findOne({ _id: id });

    const price = data.price;

    res.render("user/product-view", {
      data,
      user: req.session.user,
      price,
      cartCount,
      name,
    });
  } catch (error) {
    console.log("productView page error" + error);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

const search_product = async (req, res) => {
  try {
    const userdata = await usercollection.findOne({ email: req.session.user });
    let name = "";
    let user;

    if (userdata !== null) {
      name = userdata.name;
      user = true;
    } else {
      user = false;
    }

    const search = req.body.search;
    const products = await productCollection.find({
      name: { $regex: "^" + search, $options: "i" },
    });
    const category = await categoryCollection.find({ isavilable: true });

    if (products === null) {
      // let user = false
      let res = "product is not avilable";
      res.render("user/shop", { user, products, product: "", category, res });
    } else {
      // const user = true
      res.render("user/shop", { user, products, product: "", category, name });
    }
  } catch (error) {
    console.log("error from the search_product:" + error.message);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

//getting the home with pagination

const shop = async (req, res) => {
  try {
    const userDetails = await usercollection.findOne({
      email: req.session.user,
    });
    let cartCount, cart;
    if (userDetails) {
      cart = userDetails.cart;
      cartCount = cart.items.length;
    }
    const userdata = await usercollection.findOne({ email: req.session.user });
    const name = userdata.name;
    const category = await categoryCollection.find({ isavilable: true });

    // Pagination logic
    const productsPerPage = 6; // Change this to your desired number of products per page
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter
    const skip = (page - 1) * productsPerPage;

    const totalProducts = await productCollection.countDocuments({
      availability: true,
    });

    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const products = await productCollection
      .find({ availability: true })
      .skip(skip)
      .limit(productsPerPage);

    res.render("user/shop", {
      title: "e-Commerce",
      message: "",
      products,
      category,
      user: req.session.user,
      cartCount,
      totalPages,
      currentPage: page,
      name,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const filter = async (req, res) => {
  try {
    const userdata = await usercollection.findOne({ email: req.session.user });
    if (userdata) {
      cart = userdata.cart;
      cartCount = cart.items.length;
    }
    const name = userdata.name;
    const cat_name = req.body.category;

    const sortFilter = req.body.sortOption;

    //  console.log(`this is the category name ${cat_name},and the sort direction ${sortFilter}`);

    let sortDirection = 1; // Default ascending
    if (sortFilter === "HeighToLow") {
      sortDirection = -1; // Descending
    }

    const category = await categoryCollection.find({ isavilable: true });
    let products;
    if (cat_name) {
      products = await productCollection
        .find({ category: cat_name, availability: true })
        .sort({ price: sortDirection });
    } else {
      products = await productCollection
        .find({ availability: true })
        .sort({ price: sortDirection });
    }

    //  console.log('this is the filter products');
    //  console.log(products)
    res.render("user/shop", {
      products,
      category,
      name,
      user: req.session.user,
      cartCount,
      sortFilter,
      cat_name,
      priceRange: "Price-",
    });
  } catch (error) {
    res.render("/login");
    console.log(error.message);
  }
};

//cart details

const loadcart = async (req, res) => {
  try {
    const userEmail = req.session.user;
    const userDetails = await usercollection.findOne({ email: userEmail });
    const name = userDetails.name;
    const similarproducts = await productCollection
      .find({ availability: true })
      .sort({ name: -1 })
      .limit(4);
    const cartItems = userDetails.cart.items;
    const cartCount = cartItems.length;
    const cartProductIds = cartItems.map((item) => item.productId);
    const cartProducts = await productCollection.find({
      _id: { $in: cartProductIds },
    });
    const productsPrice = cartItems.reduce(
      (accu, element) => accu + element.quantity * element.price,
      0
    );
    const totalQuantity = cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
    let totalPrice = 0;
    for (const item of cartItems) {
      const product = cartProducts.find(
        (prod) => prod._id.toString() === item.productId.toString()
      );
      if (product) {
        totalPrice += item.quantity * product.price;
      } else {
        console.log(`Product not found for item: ${item.productId}`);
      }
    }
    const user = true;
    const discount = Math.abs(totalPrice - productsPrice);
    res.render("user/cart", {
      message: "Login Page",
      user,
      name,
      cartCount,
      cartItems,
      cartProducts,
      productsPrice,
      totalQuantity,
      totalPrice,
      discount,
      similarproducts,
    });
  } catch (error) {
    console.log("error from the loadcart:" + error);
    //   res.status(500).send("Internal error from cart side");
    const message = error.message;
    res
      .status(500)
      .render("404-error", { error: "500", message: "internal server error" });
  }
};

const Addcart = async (req, res) => {
  try {
    console.log("hello man this is add to cart");
    const id = req.params.id;
    const userEmail = req.session.user;
    const userdata = await usercollection.findOne({ email: userEmail });
    const cartItems = userdata.cart.items;
    // cartItemsCount = userdata.cart.items.length
    const cartItemExists = cartItems.find(
      (item) => item.productId.toString() === id
    );

    const product = await productCollection.findOne({ _id: id });
    const productprice = product.price;

    // console.log('this is ', product.price)
    // console.log(' this is ', product.originalprice);

    if (cartItemExists) {
      cartItemExists.quantity += 1;
      cartItemExists.price = cartItemExists.quantity * productprice;
    } else {
      const newcartitem = {
        productId: id,
        quantity: 1,
        realPrice: product.price,
        price: product.originalprice,
        offer: product.price,
      };

      userdata.cart.items.push(newcartitem);
    }

    await userdata.save();
    cartItemsCount = userdata.cart.items.length;

    res.json({
      message: "Product successfully added to your cart",
      cartItemCount: cartItemsCount,
    });
  } catch (error) {
    console.log("error from the Addcart:" + error);
    // res.status(500).send("Internal error from cart side");
    const message = error.message;
    res.status(500).render("404-error", { error, message });
  }
};

const cartQuantityUpdate = async (req, res) => {
  try {
    const cartId = req.params.itemId;
    const data = Number(req.body.quantity);
    const userEmail = req.session.user;
    const userDetails = await usercollection.findOne({ email: userEmail });

    const cartItems = userDetails.cart.items;

    const cartItem = userDetails.cart.items.id(cartId);

    const cartQuantityPre = cartItem.quantity;
    const CartQuantity = (cartItem.quantity = data);
    const offerPrice = cartItem.offer;
    const cartPrice = (cartItem.realPrice = offerPrice * CartQuantity);
    const product = await productCollection.findById(cartItem.productId);
    const ProQuantity = product.quantity;

    const GPrice = cartItems.reduce(
      (accu, element) => accu + element.quantity * element.price,
      0
    );
    const T = cartItems.reduce((accu, element) => accu + element.realPrice, 0);
    const GrandPrice = (userDetails.grantTotal = GPrice);
    const Total = (userDetails.total = T);
    // await product.save();
    await userDetails.save();

    const grantTotal = GrandPrice;
    const total = Total;
    const discount = grantTotal - total;
    res.json({ cartPrice, grantTotal, total, discount, ProQuantity });
  } catch (error) {
    console.log("error from the cartQuantityUpdate:" + error);
    // res.status(500).json({ error: 'An error occurred while updating the quantity.' });
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

const cartDelete = async (req, res) => {
  console.log("i am cart deleter");
  try {
    const id = req.params.id;
    const userEmail = req.session.user;

    await usercollection.updateOne(
      { email: userEmail },
      { $pull: { "cart.items": { _id: id } } }
    );
    res.redirect("/cart");
  } catch (error) {
    console.log("error from the cartDelete:" + error);
    // res.status(500).send("internal error at cartDelete")
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

const Checkout = async (req, res) => {
  try {
    console.log(" hey i am the checkout form");
    // const user = req.session.user;
    const email = req.session.user;
    const userDetails = await usercollection.findOne({ email: email });
    const name = userDetails.name;
    const currentUserID = userDetails._id;
    const cartItems = userDetails.cart.items;
    const cartCount = cartItems.length;
    const wishlist = userDetails.wishlist.length;

    const coupons = await couponcollection.find();

    const coupon = coupons.filter(
      (coupon) => !coupon.userId.includes(currentUserID)
    );
    const cartProductIds = cartItems.map((item) => item.productId.toString());
    const cartProducts = await productCollection.find({
      _id: { $in: cartProductIds },
    });
    const totalP_Price = cartItems.reduce(
      (total, items) => total + parseFloat(items.realPrice),
      0
    );
    const address = userDetails.address;
    let totalPrice = cartItems.reduce(
      (accu, element) => accu + element.quantity * element.price,
      0
    );
    const discount = Math.abs(totalP_Price - totalPrice);
    res.render("user/account/billing", {
      title: "Check Out",
      user,
      name,
      cartItems,
      cartProducts,
      discount,
      totalP_Price,
      totalPrice,
      address,
      cartCount,
      coupon,
      wishlist,
    });
  } catch (error) {
    console.log("error from the cartDelete:" + error);
    const message = error.message;
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const addressAdding = async (req, res) => {
  console.log("hey i am address adding function ");
  try {
    const email = req.session.user;
    const { name, houseName, street, city, state, phone, postalCode } =
      req.body;

    const userData = await usercollection.findOne({ email: email });

    if (!userData) {
      return console.log("User not found");
    }

    const newAddress = {
      name: name,
      houseName: houseName,
      street: street,
      city: city,
      state: state,
      phone: phone,
      postalCode: postalCode,
    };

    userData.address.push(newAddress);
    await userData.save();
    res.redirect("/CheckOutPage");
  } catch (error) {
    console.log("error from the addressAdding:" + error);
    res.status(500).send("Internal server error");
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

const orderSuccess = async (req, res) => {
  try {
    const currentDate = new Date();
    const data = req.body;

    const email = req.session.user;
    const foundUser = await usercollection.findOne({ email: email });

    const cartItems = foundUser.cart.items;
    // console.log(`this is cartItem ${cartItems}`);

    const cartProductIds = cartItems.map((item) => item.productId.toString());
    const cartProducts = await productCollection.find({
      _id: { $in: cartProductIds },
    });
    // console.log(`this is  cartProducts ${cartProducts}`);

    const quantityFromCart = cartItems.map((product) => product.quantity);
    // console.log(`this is  quantityFromCart ${quantityFromCart}`);

    const userId = foundUser._id;
    const addressId = data.selectedAddress;
    const method = data.method;
    const amount = data.amount;
    const coupen = data.coupenCode;
    let coupenAmount = 0;
    if (coupen) {
      const coupenData = await couponcollection.findOne({ couponName: coupen });
      coupenAmount = coupenData.couponValue;
      console.log(
        `this is the coupenCode inside the checkout ${coupen} and this is the amount ${coupenAmount}`
      );
    }

    // Data collecting for db Storing
    const productData = cartProducts.map((product, index) => ({
      p_name: product.name, // Use "p_name" instead of "nameOfTheProduct"
      realPrice: product.originalprice,
      price: product.price,
      description: product.discription, // Use "description" instead of "description"
      image: product.image,
      category: product.category,
      quantity: quantityFromCart[index],
      totalPrice: product.price * quantityFromCart[index], // Add "totalPrice" field
    }));

    const deliveryDate = new Date();
    deliveryDate.setDate(currentDate.getDate() + 5);
    newOrder = new ordercollection({
      userId: userId,
      address: addressId,
      productdetails: productData,
      payment: {
        method: method,
        amount: amount,
        transactionId: null,
      },
      couponDetails: {
        couponName: coupen,
        couponAmount: coupenAmount,
      },
      status: "Processing",
      createdAt: currentDate,
      expectedDelivery: deliveryDate,
    });

    console.log(method);
    if (method === "InternetBanking") {
      console.log("hello i am the netbanking");
      const instance = new Razorpay({ key_id: key_id, key_secret: key_secret });
      let order = await instance.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: '"order_rcptid_11"',
      });

      res.json(order);
      // res.json("successFully online payment Completed")
    } else if (method === "COD") {
      await newOrder.save();
      await couponcollection.updateOne(
        { couponName: coupen },
        { $push: { userId: userId } }
      );
      for (let values of cartItems) {
        for (let products of cartProducts) {
          if (
            new String(values.productId).trim() ==
            new String(products._id).trim()
          ) {
            products.quantity = products.quantity - values.quantity;

            await products.save();
          }
        }
      }
      foundUser.cart.items = [];
      foundUser.grantTotal = 0;
      foundUser.total = 0;
      await foundUser.save();
      res.json({ message: "successFully cod Completed", newOrder, amount });
    } else if (method === "wallet") {
      // await newOrder.save();
      console.log("i am the wallet");
      const email = req.session.user;
      const user_data = await usercollection.findOne({ email });
      const wallet = user_data.walletbalance;
      console.log("this is my wallet balance", wallet);

      const productTotal = calculateProductTotal(cartItems, cartProducts);

      function calculateProductTotal(cartItems, cartProducts) {
        let productTotal = 0;
        for (let values of cartItems) {
          for (let products of cartProducts) {
            if (
              String(values.productId).trim() === String(products._id).trim()
            ) {
              productTotal += products.price * values.quantity;
            }
          }
        }
        return productTotal;
      }

      if (wallet < productTotal) {
        console.log("insufficient balance");
        res.json("Insufficient balance in the wallet");
        // res.status(400).json("Insufficient balance in the wallet");
      } else {
        // Sufficient balance in the wallet
        console.log("wallet debt succesful");
        const w_balance = wallet - productTotal;

        try {
          console.log("this is neworder saving");
          user_data.walletbalance = w_balance;
          await user_data.save();
          await newOrder.save();
          await couponcollection.updateOne(
            { couponName: coupen },
            { $push: { userId: userId } }
          );

          user_data.wallethistory.push({
            process: "Payment",
            amount: productTotal,
          });

          // Deduct product quantities and save
          for (let values of cartItems) {
            for (let products of cartProducts) {
              if (
                String(values.productId).trim() === String(products._id).trim()
              ) {
                products.quantity -= values.quantity;
                await products.save();
              }
            }
          }

          // Clear user's cart and send success response
          foundUser.cart.items = [];
          foundUser.grantTotal = 0;
          foundUser.total = 0;
          await foundUser.save();

          res.json({
            message: "Successfully completed the payment using the wallet",
            newOrder,
          });
        } catch (error) {
          console.log("Error during transaction:", error);
          res.status(500).json("An error occurred during the transaction.");
        }
      }
    } else {
      res.status(400).send("individual payment");
    }
  } catch (error) {
    console.log("data not comming");
    res.status(500);
    const message = error.message;
    console.log(error);
    res.render("404-error", { error, message });
  }
};

const savingData = async (req, res) => {
  console.log("inside the saving data");
  try {
    // console.log(req.body.razorpayPaymentId);
    const paymentId = req.body.razorpayPaymentId;
    newOrder.payment.transactionId = paymentId;

    const couponname = req.body.coupenCode;

    await newOrder.save();
    const email = req.session.user;
    const userData = await usercollection.findOne({ email: email });

    await couponcollection.updateOne(
      { couponName: couponname },
      { $push: { userId: userData._id } }
    );

    const cartItems = userData.cart.items;
    const cartProductIds = cartItems.map((item) => item.productId.toString());
    const cartProducts = await productCollection.find({
      _id: { $in: cartProductIds },
    });

    for (let values of cartItems) {
      for (let product of cartProducts) {
        if (String(values.productId).trim() === String(product._id).trim()) {
          product.quantity -= values.quantity;
          await product.save();
        }
      }
    }

    userData.cart.items = [];
    await userData.save();
    res.json("data is saved");
  } catch (error) {
    console.log("error from the savingData:" + error);
    res
      .status(500)
      .send(
        "An error occurred while saving the order and updating product quantities"
      );
  }
};

//whislist

const WhishListLoad = async (req, res) => {
  try {
    if (req.session.user) {
      const userEmail = req.session.user;
      const userDetails = await usercollection.findOne({ email: userEmail });
      const name = userDetails.name;
      const productData = userDetails.wishlist;
      const cart = userDetails.cart.items;
      const cartCount = cart.length;
      const wishlist = userDetails.wishlist.length;

      const productId = productData.map((items) => items.productId);
      const productDetails = await productCollection.find({
        _id: { $in: productId },
      });
      const price =
        productDetails.originalprice -
        (productDetails.originalprice * productDetails.productOffer) / 100;

      res.render("user/wishList", {
        user,
        price,
        productDetails,
        cartCount,
        name,
        wishlist,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log("error from the WhishListLoad:" + error);
    const message = error.message;
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const addingWhishList = async (req, res) => {
  console.log("hey i am the add wishlist");
  try {
    const productId = req.params.id;
    const userEmail = req.session.user;
    const userDetails = await usercollection.findOne({ email: userEmail });
    const productExist = userDetails.wishlist.map(
      (items) => items.productId.toString() === productId
    );

    if (productExist.includes(true)) {
      return res.json("Already Exist");
    } else {
      const WhishList = {
        productId: productId,
      };
      userDetails.wishlist.push(WhishList);
      await userDetails.save();
      return res.json("server got this....");
    }
  } catch (error) {
    console.log("error from the addingWhishList" + error);
    const message = error.message;
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const addingWhishListtoCart = async (req, res) => {
  console.log("here in the addto cart in wishlist");

  try {
    console.log("hello i am the wishlist adding to cart");
    const id = req.params.id;
    const userEmail = req.session.user;
    const userData = await usercollection.findOne({ email: userEmail });
    const cartItems = userData.cart.items;
    const existingCartItem = cartItems.find(
      (item) => item.productId.toString() === id
    );
    const cartPrtoduct = await productCollection.findOne({ _id: id });
    const productPrice = cartPrtoduct.price;

    if (existingCartItem) {
      existingCartItem.quantity += 1;
      existingCartItem.price = existingCartItem.quantity * productPrice;
    } else {
      const newCartItem = {
        productId: id,
        quantity: 1,
        realPrice: cartPrtoduct.price,
        price: cartPrtoduct.originalprice,
        offer: cartPrtoduct.price,
      };

      userData.cart.items.push(newCartItem);
    }

    await userData.save();
    res.redirect("/wishlist");
  } catch (error) {
    console.log("Error adding to cart:", error);
    const message = error.message;
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const WhishProductDelete = async (req, res) => {
  console.log("hello i am the wishlist delete");
  try {
    const productId = req.params.id;
    const userEmail = req.session.user;
    await usercollection.findOneAndUpdate(
      { email: userEmail },
      { $pull: { wishlist: { productId: productId } } }
    );

    res.redirect("/wishlist");
  } catch (error) {
    console.log("WhishProductDelete Error" + error);
    const message = error.message;
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

//coupen
const coupons = async (req, res) => {
  try {
    console.log("i am coupen deducter");

    const couponCode = req.body.coupon;
    const TotalAmount = req.body.amount;
    console.log(couponCode, TotalAmount);

    const user = req.session.user;
    const userDetails = await usercollection.findOne({ email: user });

    const userDataId = userDetails._id;

    const couponValue = await couponcollection.findOne({
      couponName: couponCode,
    });
    const date = new Date();
    const formattedDate = date.toLocaleDateString();
    // const expiryDate = couponValue.expiryDate;
    // const expiryDateFormatted = expiryDate.toLocaleDateString();
    // console.log(expiryDateFormatted);

    if (!couponValue) {
      res.json({ message: "Coupon Not Valid" });
    } else if (couponValue) {
      const userExist = couponValue.userId.includes(userDataId);
      // const userUsed = couponValue.coupenUsedUserId.includes(userDataId);
      if (!userExist) {
        if (
          TotalAmount <= couponValue.maxValue &&
          TotalAmount >= couponValue.minValue
        ) {
          // , { $push: { userId: userDataId } }
          // await couponcollection.updateOne({ couponName: couponCode }, { $push: { coupenUsedUserId: userDataId } });
          res.json({
            message: "Coupon is succefully Added",
            coupon: couponValue,
          });
        } else {
          res.json({ message: "It is not applicable", coupon: couponValue });
        }
      } else {
        res.json({
          message: "You Already Use This Coupon",
          coupon: couponValue,
        });
      }
    }
  } catch (error) {
    console.log("error from the coupons:" + error);
    res.json("CouponExpired");
  }
};

module.exports = {
  home,
  productView,

  signup,
  signup_post,
  signup_Otpvalidation,
  resendOtp,
  search_product,

  shop,
  filter,

  login,
  login_post,
  login_OTPValidation,
  signout,

  loadcart,
  Addcart,
  cartQuantityUpdate,
  cartDelete,

  Checkout,
  addressAdding,
  orderSuccess,
  savingData,

  WhishListLoad,
  addingWhishList,
  addingWhishListtoCart,
  WhishProductDelete,

  coupons,
};
