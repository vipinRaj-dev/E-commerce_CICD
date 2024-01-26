const usercollection = require("../../models/usermodel");
const productcollection = require("../../models/productmodel");
const ordercollection = require("../../models/order");
const { CallPage } = require("twilio/lib/rest/api/v2010/account/call");
const Razorpay = require("razorpay");
const easyinvoice = require("easyinvoice");
// const mongoose = require('mongoose');
// const { MongoClient, ObjectId } = require('mongodb');

const bcrypt = require("bcrypt");

//hashing the passsword
const pwdEncription = (password) => {
  const hasheNdPWD = bcrypt.hash(password, 10);
  return hasheNdPWD;
};

const profile = async (req, res) => {
  try {
    if (req.session.user) {
      const userDetails = await usercollection.findOne({
        email: req.session.user,
      });
      let cart = userDetails.cart.items;
      let cartCount = cart.length;
      const name = userDetails.name;
      const user = true;
      const FoundUser = req.session.user;
      const userData = await usercollection.findOne({ email: FoundUser });
      res.render("user/account/profile", { user, userData, cartCount, name });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log("this is the profile error" + error);
  }
};

const order = async (req, res) => {
  try {
    console.log("i am the order list");
    // const user = req.session.user;
    const email = req.session.user;

    const userDetails = await usercollection.findOne({ email: email });

    const name = userDetails.name;
    const cart = userDetails.cart.items;
    const cartCount = cart.length;
    const userid = userDetails._id;

    const order = await ordercollection
      .find({ userId: userid })
      .sort({ _id: -1 });

    const productHistory = [];

    order.forEach((value) => {
      value.productdetails.forEach((product) => {
        if (product.cancelProduct || value.status == "Deliverd") {
          product.status = value.status;
          productHistory.push(product);
        }
      });
    });
    // console.log(`this is productHistory`);
    // console.log(productHistory);

    const product = order.map((data) => data.products);

    // console.log(`this is Product${product}`);

    const newProduct = product.flat();

    const status = order.map((data) => data.status);

    const orderstatus = order.map((data) => data.orderCancleRequest);

    const Date = order.map((data) =>
      data.expectedDelivery.toLocaleDateString()
    );
    res.render("user/account/myorder", {
      title: "OrderPage",
      name,
      user,
      newProduct,
      status,
      Date,
      order,
      orderstatus,
      cartCount,
      productHistory,
    });
  } catch (error) {
    console.log("this is the order error" + error);
  }
};

const orderStatus = async (req, res) => {
  try {
    // const user = req.session.user;
    const email = req.session.user;
    // const email = req.query.email;
    const userDetails = await usercollection.findOne({ email });
    if (userDetails.cart.items) {
      var cart = userDetails.cart.items;
    }
    const cartCount = cart.length;
    const orderId = req.params.id;
    const order = await ordercollection.findById(orderId);

    const orderProducts = order.productdetails.filter((items) => {
      return !items.cancelProduct;
    });

    // console.log(order);

    const address = userDetails.address.filter((item) => {
      // console.log(item._id.toString() , order.address.toString())
      if (item._id.toString() == order.address.toString()) return true;
      return false;
    });
    // console.log(address)

    const OriginalPrice = orderProducts.reduce(
      (total, items) => total + items.realPrice * items.quantity,
      0
    );
    // const TotalPrice = orderProducts.reduce((total, items) => total + items.totalPrice, 0);
    const TotalPrice = order.payment.amount;

    // console.log('this is OriginalPrice ',OriginalPrice)
    const orderCanceld = order.orderCancleRequest;
    const orderStatus = order.status;
    res.render("user/account/orderstatus", {
      title: "Product view",
      user: userDetails,
      cartCount,
      order: [order],
      orderProducts,
      TotalPrice,
      OriginalPrice,
      address: address[0],
      orderCanceld,
      orderStatus,
      orderObject: order,
    });
  } catch (error) {
    console.log("this is the orderStatus error:" + error);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

const orderCancel = async (req, res) => {
  try {
    const id = req.params.id;

    const userEmail = req.session.user;

    const Order = await ordercollection.findById(id);
    Order.orderCancleRequest = true;

    let totalProductsPrice = 0;
    for (let product of Order.productdetails) {
      product.cancelProduct = true;
      totalProductsPrice += product.totalPrice;
    }

    if (Order.payment.method !== "COD") {
      await usercollection.findOneAndUpdate(
        { email: userEmail },
        { $inc: { walletbalance: totalProductsPrice } }
      );
    }
    // console.log(Order.productdetails);
    await Order.save();

    res.redirect("/profile/order");
  } catch (error) {
    console.log("this is the orderCancel error:" + error);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};
const productCancel = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const productId = req.query.productId;
    const userEmail = req.session.user;

    const order = await ordercollection.findById(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const productToCancel = order.productdetails.find(
      (product) => product._id == productId
    );

    if (!productToCancel) {
      return res.status(404).send("Product not found in the order");
    }

    if (order.productdetails.length === 1) {
      order.orderCancleRequest = true;
      productToCancel.cancelProduct = true;

      if (order.payment.method !== "COD") {
        const productPrice = productToCancel.totalPrice;
        await usercollection.findOneAndUpdate(
          { email: userEmail },
          { $inc: { walletbalance: productPrice } }
        );
      }
    } else {
      productToCancel.cancelProduct = true;
      order.payment.amount = order.payment.amount - productToCancel.totalPrice;

      if (order.payment.method !== "COD") {
        const productPrice = productToCancel.totalPrice;
        await usercollection.findOneAndUpdate(
          { email: userEmail },
          { $inc: { walletbalance: productPrice } }
        );
      }
    }

    await order.save();
    res.redirect("/profile/order");
  } catch (error) {
    console.error(error);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

const successTick = async (req, res) => {
  try {
    if (req.session.user) {
      const userData = await usercollection.findOne({
        email: req.session.user,
      });
      const name = userData.name;
      const cart = userData.cart.items;
      let cartCount = cart.length;
      res.render("user/successtic", {
        title: "Account",
        succ: "Success.....",
        cartCount,
        name,
      });
    }
  } catch (error) {
    console.log("this is the successTick error:" + error.message);
    const message = error.message;
    res.render("404-error", { error, message });
  }
};

//wallet

const loadWallet = async (req, res) => {
  try {
    const userDetails = await usercollection.findOne({
      email: req.session.user,
    });
    const name = userDetails.name;
    const cart = userDetails.cart.items;
    const cartCount = cart.length;
    const wishlist = userDetails.wishlist.length;
    // console.log('this is the wishlist count ', wishlist)

    const wallet_Balance = userDetails.walletbalance;
    // console.log('this is my wallet balance ', wallet_Balance)
    let totalProducts = 0;
    for (let i = 0; i < userDetails.cart.length; i++) {
      totalProducts += userDetails.cart[i].quantity;
    }
    res.render("user/account/wallet", {
      userDetails,
      totalProducts,
      wallet_Balance,
      name,
      cartCount,
      wishlist,
    });
  } catch (err) {
    console.log("Error in loading wallet:", err);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const topUpWallet = async (req, res) => {
  // console.log('i am the topup ')
  const razorpayInstance = new Razorpay({
    key_id: "rzp_test_kjs3Abj9teKyq6",
    key_secret: "oo3gc41lM7OUEGWwjuFfLx0S",
  });
  try {
    const topUpAmount = req.body.topUpAmount;
    const user = await usercollection.findOne({ email: req.session.user });
    const amount = topUpAmount * 100;
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };

    razorpayInstance.orders.create(options, (err, order) => {
      if (!err) {
        res.status(200).send({
          // method:'UPI',
          success: true,
          amount: amount,
          key_id: "rzp_test_kjs3Abj9teKyq6",
          contact: "9074916473",
          name: user.name,
          email: req.session.user,
          topUpAmount: topUpAmount,
        });
      } else {
        console.log(err);
        res.status(400).send({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (err) {
    console.log("Error in topUpWallet:", err);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const verifyTopUp = async (req, res) => {
  try {
    // console.log("body",req.body);
    const topUpAmount = req.body.topUpAmount;
    const user = await usercollection.findOne({ email: req.session.user });
    await usercollection.updateOne(
      { email: req.session.user },
      { $inc: { walletbalance: topUpAmount } }
    );
    // wallet history
    user.wallethistory.push({
      process: "TopUp",
      amount: topUpAmount,
    });
    await user.save();
    res.status(200).send({ success: true });
  } catch (err) {
    console.log("error in verifying topup", err);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const loadWalletHistory = async (req, res) => {
  try {
    const userDetails = await usercollection.find({ email: req.session.user });
    const name = userDetails.name;
    // const cart = userDetails.cart.items;
    // const cartCount = cart.length;
    let totalProducts = 0;
    for (let i = 0; i < userDetails[0].cart.length; i++) {
      totalProducts += userDetails[0].cart[i].quantity;
    }
    // const user = await usercollection.findOne({ username: req.session.user });
    res.render("user/account/walletHistory", {
      userDetails,
      totalProducts,
      name,
    });
  } catch (err) {
    console.log("Error in loading wallet history", err);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const profileAddress = async (req, res) => {
  try {
    // const user = req.session.user;
    const userEmail = req.session.user;
    const userData = await usercollection.findOne({ email: userEmail });
    let cart = userData.cart.items;
    let cartCount = cart.length;
    const wishlist = userData.wishlist.length;
    // console.log('this is the wishlist count ', wishlist)
    const userAddress = userData.address;
    const name = userData.name;
    res.render("user/account/address", {
      userAddress,
      cartCount,
      name,
      wishlist,
    });
  } catch (error) {
    console.log("this is the profileAddress error:" + error);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};
const editAddress = async (req, res) => {
  try {
    // console.log('i am address editor')
    // const user = req.session.user;
    const addressId = req.body.selectedAddress;
    const userDetails = await usercollection.findOne({
      email: req.session.user,
    });
    const name = userDetails.name;
    const cart = userDetails.cart.items;
    const cartCount = cart.length;
    const wishlist = userDetails.wishlist.length;
    // console.log('this is the wishlist count ', wishlist)
    const address = userDetails.address;
    const selectedAddress = address.find(
      (data) => data._id.toString() === addressId
    );
    res.render("user/account/editaddress", {
      selectedAddress,
      cartCount,
      name,
      wishlist,
    });
  } catch (error) {
    console.log("error in the editAddress:" + error);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const updateaddress = async (req, res) => {
  try {
    const email = req.session.user;
    const {
      name,
      houseName,
      street,
      city,
      state,
      phone,
      postalCode,
      AddressId,
    } = req.body;
    const userData = await usercollection.findOne({ email: email });
    const exisitingAddress = userData.address.find(
      (data) => data._id.toString() === req.body.AddressId
    );

    if (exisitingAddress) {
      exisitingAddress.name = name;
      exisitingAddress.houseName = houseName;
      exisitingAddress.street = street;
      exisitingAddress.city = city;
      exisitingAddress.state = state;
      exisitingAddress.phone = phone;
      exisitingAddress.postalCode = postalCode;
    } else {
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
    }
    await userData.save();
    res.redirect("/profile/address");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};
const profileUpdate = async (req, res) => {
  // console.log('i am the profile update')
  try {
    const userEmail = req.session.user;
    const userData = await usercollection.findOne({ email: userEmail });

    let cart = userData.cart.items;
    let cartCount = cart.length;
    const wishlist = userData.wishlist.length;

    const { name, email, number, password, password1, password2 } = req.body;
    if (password1 !== password2) {
      res.render("user/account/profile", {
        title: "Profile",
        user,
        userData,
        error: "Check the password currectly",
      });
    }
    const isMatch = await bcrypt.compare(password, userData.password);
    if (isMatch) {
      const encryptedPwd = await pwdEncription(password1);
      (userData.name = name),
        (userData.email = email),
        (userData.mobile = number),
        (userData.password = encryptedPwd);
      await userData.save();
      req.session.email = userData.email;
      req.session.user = userData.email;
      res.render("user/account/profile", {
        title: "Profile",
        user,
        userData,
        success: "Successfully Updated",
        cartCount,
        wishlist,
      });
    } else {
      res.render("user/account/profile", {
        title: "Profile",
        user,
        userData,
        error: "Please check Your Current Password & Updated Email ID",
        cartCount,
        wishlist,
      });
    }
  } catch (error) {
    console.log("error from the profileUpdate:" + error);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};
const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
const productCollection = require("../../models/productmodel");

const listReturn = async (req, res) => {
  try {
    const user = req.session.user;
    const userDetails = await usercollection.findOne({ email: user });

    const name = userDetails.name;
    const cart = userDetails.cart.items;
    const cartCount = cart.length;
    const wishlist = userDetails.wishlist.length;

    const userid = userDetails._id;
    const returnProduct = await ordercollection.find({
      userId: userid,
      "productdetails.returnProduct": true,
    });
    const totalAmount = returnProduct
      .filter((product) => product.status === "Return Accepted")
      .reduce((sum, item) => sum + item.payment.amount, 0);

    userDetails.walletbalance = totalAmount + userDetails.walletbalance;

    userDetails.save();

    const order = await ordercollection.updateMany(
      { status: "Return Accepted", userId: userid },
      { $set: { status: "Refund Done" } }
    );

    // console.log(`this is the order products`)
    // console.log(order);

    res.render("user/account/return", {
      title: "OrderPage",
      name,
      user,
      cartCount,
      returnProduct,
      wishlist,
    });
  } catch (error) {
    console.log("error from the listReturn" + error);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const orderReturn = async (req, res) => {
  try {
    const id = req.params.id;

    // Convert the ID from string to ObjectId
    const orderId = new ObjectId(id);

    const updatedOrder = await ordercollection.updateOne(
      { "productdetails._id": orderId },
      {
        $set: {
          "productdetails.$.returnProduct": true,
          status: "Return Requested",
        },
      }
    );

    if (updatedOrder.matchedCount === 0) {
      // Handle the case where the order with the given ID was not found
      return res.status(404).send("Order not found");
    }

    res.redirect("/profile/order");
  } catch (error) {
    console.log("error from the orderReturn:" + error);
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

const generateInvoice = async (order, orderProducts, address) => {
  try {
    const invoiceOptions = {
      documentTitle: "Invoice",
      currency: "INR",
      taxNotation: "GST",
      marginTop: 25,
      marginRight: 25,
      marginLeft: 25,
      marginBottom: 25,
      images: {
        logo: "",
      },
      sender: {
        company: "E-Shop",
        address: "Kazhakuttam",
        zip: "695121",
        city: "Trivandrum",
        country: "Kerala",
        phone: "759-857-0568",
      },
      client: {
        company: address.name,
        address: address.houseName,
        zip: address.street,
        city: address.city,
        country: address.phone,
        phone: address.postalCode,
      },
      information: {
        Number: order.map((item) => item._id),
        Date: order.map((item) => item.createdAt.toLocaleDateString()),
        Delevery_Date: order.map((item) =>
          item.expectedDelivery.toLocaleDateString()
        ),
      },
      products: [],

      bottomNotice: "Discount: $10",
      subtotal: 185,
      total: 175,
    };
    orderProducts.forEach((data) => {
      invoiceOptions.products.push({
        quantity: data.quantity,
        description: data.p_name,
        "tax-rate": 0,
        price: data.price,
      });
    });
    const result = await easyinvoice.createInvoice(invoiceOptions);
    const pdfBuffer = Buffer.from(result.pdf, "base64");

    return pdfBuffer;
  } catch (error) {
    console.log("Error generating invoice:", error);
    throw error;
  }
};

const pdf = async (req, res) => {
  try {
    const orderId = req.query.id;
    const userDetails = await usercollection.findOne({
      email: req.session.user,
    });
    const order = await ordercollection.find({ _id: orderId });
    const orderProducts = order.map((items) => items.productdetails).flat();
    console.log("this is the orderProducts");
    // console.log(orderProducts);
    // const cartProducts = order.map(items => items.cartProduct).flat();
    // console.log(cartProducts)
    // for (let i = 0; i < orderProducts.length; i++) {
    //     const orderProductId = orderProducts[i]._id;
    //     const matchingCartProduct = cartProducts.find(cartProduct => cartProduct.productId.toString() === orderProductId.toString());

    //     if (matchingCartProduct) {
    //         orderProducts[i].cartProduct = matchingCartProduct;
    //     }
    // }

    const address = userDetails.address.find(
      (items) =>
        items._id.toString() == order.map((items) => items.address).toString()
    );
    // const subTotal = orderProducts.reduce((totals, items) => totals + items.realPrice, 0);
    // const [orderCanceld] = order.map(item => item.orderCancleRequest);
    const orderStatus = order.map((item) => item.status);

    const invoiceBuffer = await generateInvoice(
      order,
      orderProducts,
      address,
      orderStatus
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename = invoice.pdf");
    res.send(invoiceBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
    res
      .status(500)
      .render("404-error", { error: 500, message: "Internal Server Error" });
  }
};

module.exports = {
  profile,
  order,
  orderStatus,
  orderCancel,
  successTick,
  productCancel,
  pdf,

  loadWallet,
  topUpWallet,
  verifyTopUp,
  loadWalletHistory,

  profileAddress,
  editAddress,
  updateaddress,
  profileUpdate,

  listReturn,
  orderReturn,
};
