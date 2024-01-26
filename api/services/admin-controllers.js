const admincollection = require("../../models/adminmodel");
const userCollection = require("../../models/usermodel");
const categorycollection = require("../../models/categorymodel");
const productCollection = require("../../models/productmodel");
const ordercollection = require("../../models/order");
const coupencollection = require("../../models/coupon");
const bannrcollection = require("../../models/banners");

const fs = require("fs");

// admincontroller.js

const dashboard = async (req, res) => {
  try {
    if (req.session.admin) {
      const userData = await userCollection.find();
      const order = await ordercollection.find();
      const orderPdf = await ordercollection.find(
        {},
        { _id: 1, status: 1, payment: 1 }
      );
      //console.log("orderPdf>>",orderPdf)
      const product = await productCollection.find();

      const orderDeliverd = order.filter((data) => data.status === "Deliverd");
      const refundOrders = order.filter(
        (data) => data.status === "Refund Done"
      );
      const ProcessingOrders = order.filter(
        (data) => data.status === "Processing"
      );
      const orderCanceled = order.filter((data) => data.status === "Canceled");
      const returnRequested = order.filter(
        (data) => data.status === "Return Requested"
      );

      const canceled = orderCanceled.length;
      const orderProcessing = ProcessingOrders.length;
      const orderrefund = refundOrders.length;
      const requestedReturns = returnRequested.length;

      const totalAmount = orderDeliverd.reduce(
        (total, product) => total + parseInt(product.payment.amount),
        0
      );

      const totalSales = orderDeliverd.length;
      console.log(totalSales);
      const totalUser = userData.length;
      console.log(totalUser);
      const totalOrder = order.length;
      console.log(totalOrder);
      const totalProduct = product.length;
      console.log(totalProduct);

      const orderStatus = {};
      // Retrieve all unique status values from the database
      const uniqueStatusValues = [...new Set(order.map((data) => data.status))];
      // Initialize the orderStatus object with the status values
      uniqueStatusValues.forEach((status) => {
        orderStatus[status] = 0;
      });
      // Count the occurrences of each status
      order.forEach((data) => {
        orderStatus[data.status]++;
      });

      const cata = await categorycollection.find();
      const categoryCount = cata.length;
      const method = await ordercollection.find();

      const admin = false;
      res.render("admin/dashboard", {
        admin,
        totalSales,
        orderProcessing,
        orderrefund,
        requestedReturns,
        categoryCount,
        totalAmount: totalAmount,
        totalUser,
        canceled,
        totalOrder,
        order,
        orderPdf,
        totalProduct,
        cata,
        method,
        orderStatus: JSON.stringify(orderStatus),
      });
    } else {
      const admin = true;
      res.render("admin/adminlogin", { admin, errmsg: "please Login" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const graph = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const { categoryname, salesRe, year, month, today } = req.body;

    let data;
    if (req.body.salesRe == "Yearly") {
      const targetYear = parseInt(req.body.year);

      data = await ordercollection.aggregate([
        {
          $match: {
            //status: { $in: ["Delivered", "Returned", "Cancelled","Processing"] },
            // Add your matching conditions here
            createdAt: {
              $gte: new Date(targetYear, 0, 1),
              $lt: new Date(targetYear + 1, 0, 1),
            },
          },
        },
        {
          $group: {
            _id: "$status", // Group by status
            count: { $sum: 1 }, // Count occurrences of each status
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            label: "$_id", // Create a 'label' field with status value
            value: "$count", // Create a 'value' field with count value
          },
        },
      ]);

      //   console.log("allOrder>>",data);
      res.json(data);
    } else if (req.body.salesRe === "Monthly") {
      const [targetYear, targetMonth] = month.split("-");

      const data = await ordercollection.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(targetYear, targetMonth - 1, 1),
              $lt: new Date(targetYear, targetMonth, 1),
            },
          },
        },
        {
          $group: {
            _id: "$status", // Group by status
            count: { $sum: 1 }, // Count occurrences of each status
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            label: "$_id", // Create a 'label' field with status value
            value: "$count", // Create a 'value' field with count value
          },
        },
      ]);

      // console.log("data>>", data);
      res.json(data);
    } else if (req.body.salesRe === "Daily") {
      data = await ordercollection.aggregate([
        {
          $match: {
            // Add your matching conditions here
            createdAt: {
              $gte: new Date(today), // Start of the given date
              $lt: new Date(today + "T23:59:59.999Z"), // End of the given date
            },
          },
        },
        {
          $group: {
            _id: "$status", // Group by status
            count: { $sum: 1 }, // Count occurrences of each status
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            label: "$_id", // Create a 'label' field with status value
            value: "$count", // Create a 'value' field with count value
          },
        },
      ]);
      // console.log("data>>",data);
      res.json(data);
    } else {
      data = {};
      res.json(data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const graphcategory = async (req, res) => {
  console.log("it is the graph");
  // const categoryName = req.body.category;

  try {
    // Fetch and aggregate data based on the selected category
    const data = await ordercollection.aggregate([
      // {
      //   $match: {
      //     'payment.method': categoryName,
      //   },
      // },
      {
        $group: {
          _id: "$payment.method", // Group by payment method
          totalAmount: { $sum: { $toInt: "$payment.amount" } }, // Calculate total payment amount
          count: { $sum: 1 }, // Calculate the count of orders
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id", // Use payment method as the label
          totalAmount: 1,
          count: 1,
        },
      },
    ]);

    //   console.log("data>> this is the payments methods datas", data);
    res.json(data); // Send the data as a JSON response
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
};

const productCountGraph = async (req, res) => {
  try {
    console.log("inside the productCountGraph");
    const data = await productCollection.aggregate([
      {
        $group: {
          _id: "$category", // Group by payment method
          count: { $sum: 1 }, // Calculate the count of orders
        },
      },
      {
        $project: {
          _id: 0,
          label: "$_id", // Use payment method as the label
          count: 1,
        },
      },
    ]);
    res.json(data); // Send the data as a JSON response
  } catch (error) {
    console.log("error inside the productCountGraph:" + error);
  }
};

const salesReport = async (req, res) => {
  let admin = false;
  try {
    console.log(req.query);
    const { salesRe, year, month, date } = req.query;
    let match;
    if (salesRe == "Yearly") {
      match = {
        $match: {
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          },
          status: { $nin: ["Canceled", "Refund Done"] },
        },
      };
    } else if (salesRe === "Monthly") {
      const [targetYear, targetMonth] = month.split("-");
      match = {
        $match: {
          createdAt: {
            $gte: new Date(targetYear, targetMonth - 1, 1),
            $lt: new Date(targetYear, targetMonth, 1),
          },
          status: { $nin: ["Canceled", "Refund Done"] },
        },
      };
    } else if (salesRe === "Daily") {
      match = {
        $match: {
          createdAt: {
            $gte: new Date(date), // Start of the given date
            $lt: new Date(date + "T23:59:59.999Z"), // End of the given date
          },
          status: { $nin: ["Canceled", "Refund Done"] },
        },
      };
    } else {
      match = { $match: {} };
    }

    console.log(match);
    const order = await ordercollection.aggregate([
      match,
      {
        $unwind: "$productdetails", // Unwind the products array
      },
      // {
      //     $group: {
      //         _id: {
      //             name: '$productdetails.p_name'
      //         },
      //         payment: { $first: '$payment.method' },
      //         status: { $first: '$status' },
      //         count: { $sum: 1 } // Count the number of occurrences
      //     }
      // },
      {
        $project: {
          _id: 0, // Exclude the _id field
          name: "$productdetails.p_name",
          price: "$productdetails.price",
          payment: "$payment.method",
          quantity: "$productdetails.quantity",
          status: 1,
          count: 1,
        },
      },
    ]);
    console.log("this is the order from the sale report");
    console.log(order);

    res.render("admin/salesReport", { title: " ", order, admin, message: "" });
  } catch (error) {
    console.log(error);
  }
};

// const salesReportPdf = async (req, res) => {
//     try {
//         console.log(' i am the pdf downloader')
//       // Fetch orders from the database
//       const order = await ordercollection.find();
//     //   console.log("order",order)

//       // Create the data for the PDF invoice
//       const invoiceOptions = {
//         currency: 'USD',
//         taxNotation: 'vat',
//         marginTop: 25,
//         marginRight: 25,
//         marginLeft: 25,
//         marginBottom: 25,
//         header: {
//             text: 'Sales Report', // Change the text here
//             alignment: 'right', // Adjust alignment as needed
//           },
//         // logo: 'https://www.example.com/logo.png', // Your logo URL
//         //background: 'https://www.example.com/background.png', // Background image URL
//         sender: {
//           company: 'E-Shop',
//           address: 'Kazhakoottum',
//           zip: '629 163',
//           city: 'Trivandrum',
//           country: 'Kerala',
//           phone: '7598570568',
//         },
//         client: {
//           company: ' ',
//           address: ' ',
//           zip: ' ',
//           city: ' ',
//           country: ' ',
//           phone: ' ',
//         },
//         information: {
//             invoiceNumber: 'INV-12345',
//             invoiceDate: new Date().toISOString().slice(0, 10), // Current date in YYYY-MM-DD format
//             product: [],
//             bottomNotice: 'Thank you for your business!',
//         },
//           products: [],

//           bottomNotice: 'Discount: $10',
//           subtotal: 185,
//           total: 175,
//         };
//     order.forEach((data) => {
//         if (data.productdetails && data.productdetails.length > 0) {
//           data.productdetails.forEach((product) => {
//             invoiceOptions.products.push({
//               quantity: product.quantity,
//               description: product.p_name, // Include product description or name
//               price: product.totalPrice, // Include product price
//             });
//           });
//         }
//       });

//       console.log('this is my order detials',order)

//       const result = await easyinvoice.createInvoice(invoiceOptions);
//       const pdfBuffer = Buffer.from(result.pdf, 'base64');
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename=Report.pdf');
//     res.send(pdfBuffer);
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error: ');
//     }
//   };

const login = (req, res) => {
  try {
    res.redirect("dashboard");
  } catch (error) {
    console.log(error.message);
  }
};
// const login_post = async (req, res) => {
//   // console.log(req.body);
//   try {
//     const admin = req.body;
    
//     const foundAdmin = await admincollection.findOne({ email: admin.email });
//     // console.log("admin"+admin , "foundadmin" + foundAdmin )
    
    

//     if (foundAdmin) {
//       const password = foundAdmin.password;

//       if (admin.password === password) {
//         req.session.admin = admin.email;
//         return res.redirect("dashboard");
//       }
//     }

//     res.render("admin/adminlogin", {
//       msg: "Invalid login credentials",
//       admin: true,
//     });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send("Server Error");
//   }
// };


const login_post = async (req, res) => {
  // console.log(req.body);
  try {
    const admin = req.body;
    console.log('i am inside login post');
    const foundAdmin = await admincollection.findOne({ email: admin.email });
    // console.log("admin" + admin, "foundadmin" + foundAdmin);

    if (foundAdmin) {
      const password = foundAdmin.password;

      // Use a secure method for comparing passwords, e.g., bcrypt.compare
      const passwordsMatch = admin.password === password;

      if (passwordsMatch) {
        req.session.admin = admin.email;
        return res.redirect("dashboard");
      }
    }

    res.render("admin/adminlogin", {
      msg: "Invalid login credentials",
      admin: true,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};


const adminLogout = async (req, res) => {
  try {
    req.session.admin = null;
    res.render("admin/adminlogin");
  } catch (error) {
    console.log("error from the adminLogout:" + error);
  }
};

const userPerPage = 5; // Change this to your desired number of products per page

//product get with the pagination
const users = async (req, res) => {
  try {
    if (req.session.admin) {
      let admin = false;
      const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter

      const skip = (page - 1) * userPerPage;

      const totalusers = await userCollection.count();

      const totalPages = Math.ceil(totalusers / userPerPage);

      const userdata = await userCollection
        .find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(userPerPage);

      res.render("admin/users", {
        userdata,
        admin,
        totalPages,
        currentPage: page,
      });
    } else {
      let admin = true;
      res.render("admin/adminlogin", { admin, errmsg: "please Login" });
    }
  } catch (error) {
    console.log("error from the users:" + error.message);
  }
};

const user_search = async (req, res) => {
  const search = req.body.search;
  const userdata = await userCollection.find({
    name: { $regex: "^" + search, $options: "i" },
  });

  let admin = false;
  let nodataMessage = "";

  if (userdata.length === 0) {
    nodataMessage = "No data available";
    res.render("admin/users", { userdata, admin, nodata: nodataMessage });
  } else {
    let admin = false;
    res.render("admin/users", { userdata, admin });
  }
};

//blocking the user

const userblocking = async (req, res) => {
  try {
    const userId = req.query.id;

    await userCollection.updateOne(
      { _id: userId },
      {
        $set: {
          isblocked: true,
        },
      }
    );
    res.redirect("/admin/users");
  } catch (err) {
    console.log("error from the userblocking:" + err);
  }
};

//unblocking the user
const userUnBlocking = async (req, res) => {
  try {
    const userId = req.query.id;
    await userCollection.updateOne(
      { _id: userId },
      {
        $set: {
          isblocked: false,
        },
      }
    );
    res.redirect("/admin/users");
  } catch (err) {
    console.log("error from the userUnBlocking:" + err);
  }
};

//category controls

const category = async (req, res) => {
  try {
    if (req.session.admin) {
      let admin = false;
      const data = await categorycollection.find();
      res.render("admin/category", { data, admin });
    } else {
      let admin = true;
      res.render("admin/adminlogin", { admin, errmsg: "please Login" });
    }
  } catch (error) {
    console.log("error from the category:" + error.message);
  }
};

//getting the create page
const create_category = (req, res) => {
  try {
    if (req.session.admin) {
      const admin = false;
      res.render("admin/category-create", { admin });
    } else {
      const admin = true;
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("Error from the create_category:" + error);
  }
};
//posting the category
const create_category_post = async (req, res) => {
  try {
    const category = await categorycollection.findOne({
      categoryName: {
        $regex: new RegExp(req.body.categoryName.replace(/\s+/g, "\\s*"), "i"),
      },
    });

    if (category) {
      // Category with the same name already exists
      const admin = false;
      res.render("admin/category-create", {
        errmsg: "Category already exist",
        admin,
      });
    } else {
      const admin = false;
      const data = {
        categoryName: req.body.categoryName,
        categoryDescription: req.body.description,
        isavilable: req.body.isAvailable,
      };
      await categorycollection.create(data);
      res.render("admin/category-create", {
        msg: "Category added successfully",
        admin,
      });
    }
  } catch (err) {
    console.log("Error from the create_category_post:" + err.message);
    // Handle the error appropriately, e.g., send an error response or redirect to an error page.
    res.status(500).send("Internal Server Error");
  }
};
//editing the category details
const edit_categories = async (req, res) => {
  try {
    const id = req.query.id;
    const list = await categorycollection.findOne({ _id: id });

    res.render("admin/category-edit", { list, admin: true });
  } catch (err) {
    console.log("Error from the edit_categories:" + err.message);
  }
};
//posting the editted details

const categoryEditpost = async (req, res) => {
  try {
    const { categoryName, description, isavailable, discount } = req.body;
    await categorycollection.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          categoryName: categoryName,
          categoryDescription: description,
          isavailable: isavailable,
          categoryDiscount: discount,
        },
      }
    );
    const name = categoryName.trim();
    const products = await productCollection.find({ category: name });

    function calculateDiscountedPrice(originalPrice, discountPercentage) {
      const discountAmount = (originalPrice * discountPercentage) / 100;
      return originalPrice - discountAmount;
    }

    products.forEach(async (product) => {
      let originalPrice;
      let discountPercentage;

      if (discount > 0) {
        originalPrice = product.price;
        discountPercentage = discount;
      } else {
        originalPrice = parseInt(product.originalprice);
        discountPercentage = parseInt(product.productOffer);
      }

      const discountedPrice = calculateDiscountedPrice(
        originalPrice,
        discountPercentage
      );
      await productCollection.updateOne(
        { _id: product._id },
        { $set: { price: discountedPrice } }
      );
    });

    res.redirect("/admin/category");
  } catch (error) {
    console.log("error from the categoryEditpost:" + error);
    res.status(500).send("Internal Server Error");
  }
};

//unlisting
const unlistCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    await categorycollection.findByIdAndUpdate(
      { _id: categoryId },
      {
        $set: { isavilable: false },
      }
    );

    res.redirect("/admin/category");
  } catch (error) {
    console.log("error from the unlistCategory" + error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//listing
const listCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    await categorycollection.findByIdAndUpdate(
      { _id: categoryId },
      {
        $set: { isavilable: true },
      }
    );
    res.redirect("/admin/category");
  } catch (error) {
    console.log("error from the listCategory:" + error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const productsPerPage = 5; // Change this to your desired number of products per page

//product get with the pagination
const products = async (req, res) => {
  try {
    let admin = false;
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter

    const skip = (page - 1) * productsPerPage;

    const totalProducts = await productCollection
      .find({ softdelete: { $ne: false } })
      .count();

    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const product = await productCollection
      .find({ softdelete: { $ne: false } })
      // .sort({name:1})
      .skip(skip)
      .limit(productsPerPage);

    res.render("admin/viewproducts", {
      product,
      admin,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log("error from the products:" + error.message);
  }
};

//get the add product page
const add_product = async (req, res) => {
  try {
    //getting categoryName to the dropdown of the options available in the database
    const categoryName = await categorycollection.find({}, { categoryName: 1 });

    res.render("admin/add-products", { categoryName, msg: "", admin: false });
  } catch (error) {
    console.log("error from the add_product:" + error.message);
  }
};

//posting the product
const add_product_post = async (req, res, next) => {
  try {
    console.log("inside the post product");
    const files = req.files;
    const originalprice = parseInt(req.body.originalprice);
    const productOffer = parseInt(req.body.offers);
    const updatingPrice = Math.round(
      originalprice - (originalprice * productOffer) / 100
    );

    const product = {
      name: req.body.name,
      price: updatingPrice,
      originalprice: req.body.originalprice,
      productOffer: req.body.offers,
      quantity: req.body.quantity,
      discription: req.body.discription.trim(),
      category: req.body.category.trim(),
      image: files.map((file) => file.filename),
    };

    await productCollection.insertMany([product]);
    res.redirect("/admin/view-product");
  } catch (error) {
    console.log("error from the add_product_post:" + error.message);
  }
};

//get the edit product page
const edit_product = async (req, res) => {
  try {
    const id = req.params.id;
    const productData = await productCollection.findOne({ _id: id });
    res.render("admin/edit-product", { productData, admin: false });
  } catch (error) {
    console.log("error from the edit_product:" + error.message);
    res.status(500).send("Internal error");
  }
};

const editproduct_post = async (req, res) => {
  try {
    const id = req.body.id;

    // Retrieve existing product data
    const existingProduct = await productCollection.findById(id);
    // Check if the product with the specified ID exists
    if (!existingProduct) {
      return res.status(404).send("Product not found");
    }

    const existingImages = existingProduct.image;

    //adding the discount
    const originalprice = parseInt(req.body.price);
    const productOffer = parseInt(req.body.Offer);
    const updatingPrice = originalprice - (originalprice * productOffer) / 100;

    // Get the list of images to delete based on checkbox values
    const imagesToDelete = req.body.imagesToDelete || [];

    // Delete images that are not selected (checkbox not ticked)
    const imagesToKeep = existingImages.filter(
      (image) => !imagesToDelete.includes(image)
    );

    existingImages.forEach((filename) => {
      if (!imagesToKeep.includes(filename)) {
        fs.unlink(`productImages/${filename}`, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
    });

    const updatedData = {
      name: req.body.name,
      price: updatingPrice,
      originalprice: req.body.price,
      productOffer: req.body.Offer,
      discription: req.body.discription,
      category: req.body.category,
      quantity: req.body.quantity,
      image: imagesToKeep, // Set the updated image list
    };

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      updatedData.image = updatedData.image.concat(newImages); // Add new images
    }

    await productCollection.findByIdAndUpdate(id, updatedData);
    res.redirect("/admin/view-product");
  } catch (error) {
    console.log("error from the editproduct_post:" + error);
    res.status(500).send("Internal error");
  }
};

//search the product
const search_product = async (req, res) => {
  try {
    const search = req.body.search;

    const product = await productCollection.find({
      $and: [
        { name: { $regex: "^" + search, $options: "i" } },
        { softdelete: true },
      ],
    });

    let admin = false;
    let nodataMessage = "";

    if (product.length === 0) {
      nodataMessage = "No data available";
      res.render("admin/viewproducts", {
        product,
        admin,
        nodata: nodataMessage,
      });
    } else {
      let admin = false;
      res.render("admin/viewproducts", { product, admin });
    }
  } catch (err) {
    console.log("error from the search_product:" + err.message);
  }
};

//deleting the product

const productDelete = async (req, res) => {
  try {
    const id = req.params.id;
    const existingProduct = await productCollection.findById(id);

    await productCollection.findByIdAndUpdate(
      { _id: id },
      { $set: { softdelete: false } }
    );
    res.redirect("/admin/view-product");
  } catch (error) {
    console.log("error from the productDelete:" + error);
  }
};

//unlisting the product
const prodUnlist = async (req, res) => {
  try {
    const prod_Id = req.params.id;
    await productCollection.findByIdAndUpdate(
      { _id: prod_Id },
      {
        $set: {
          availability: false,
        },
      }
    );
    res.redirect("/admin/view-product");
  } catch (error) {
    console.log("error from the prodUnlist:" + error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//listing the product
const prodlist = async (req, res) => {
  try {
    const prod_Id = req.params.id;
    await productCollection.findByIdAndUpdate(
      { _id: prod_Id },
      {
        $set: {
          availability: true,
        },
      }
    );
    res.redirect("/admin/view-product");
  } catch (error) {
    console.log("error from the prodlist:" + error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const orderList = async (req, res) => {
  try {
    if (req.session.admin) {
      const admin = false;
      const orderList = await ordercollection.find();

      const user = orderList.map((item) => item.userId);
      const userData = await userCollection.find({ _id: { $in: user } });

      const ordersWithData = orderList.map((order) => {
        const user = userData.find(
          (user) => user._id.toString() === order.userId.toString()
        );
        return {
          ...order.toObject(),
          user: user,
        };
      });

      const ordersWithDataSorted = ordersWithData.sort(
        (a, b) => b.createdAt - a.createdAt
      );

      res.render("admin/orders", { admin, orderList: ordersWithDataSorted });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("error from the orderList:" + error);
  }
};

const orderDetails = async (req, res) => {
  try {
    console.log(`inside te order details`);
    const admin = false;
    const userId = req.body.userId;
    const orderId = req.body.orderId;

    const userDetails = await userCollection.findOne({ _id: userId });

    const order = await ordercollection.findById(orderId);

    const orderProducts = order.productdetails;

    let subTotal = 0,
      discount,
      totalPrice = 0;
    orderProducts.map((product) => {
      if (!product.cancelProduct) {
        subTotal += product.realPrice * product.quantity;
        totalPrice += product.totalPrice;
      }
    });
    discount = subTotal - totalPrice;
    const address = userDetails.address.find((items) => {
      return items._id.toString() == order.address.toString();
    });

    const orderCanceld = order.orderCancleRequest;
    const orderStatus = order.status;
    res.render("admin/orderDetails", {
      admin,
      order: [order],
      orderProducts,
      subTotal,
      address,
      orderCanceld,
      orderStatus,
      userDetails,
      discount,
      totalPrice,
    });
  } catch (error) {
    console.log("error from the orderDetails:" + error);
  }
};

const orderstatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = req.body.status;
    await ordercollection.findByIdAndUpdate(
      { _id: orderId },
      {
        $set: {
          status: status,
        },
      }
    );
    res.json(status);
  } catch (error) {
    console.log("error in the orderstatus updation" + error);
    res.json("error in the orderstatus updation");
  }
};

const couponsList = async (req, res) => {
  try {
    if (req.session.admin) {
      const admin = false;
      const couponData = await coupencollection.find();
      res.render("admin/coupen", { admin, couponData, couponData });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("error from the couponsList:" + error);
    res.status(500).send("couponRendering Error");
  }
};

const couponsAdding = async (req, res) => {
  try {
    const admin = false;
    res.render("admin/add-coupen", { admin });
  } catch (error) {
    console.log("error from the couponsAdding" + error);
    res.status(500).send("couponAddingPage Rendering Error");
  }
};

function dateValidation(inputDate) {
  const inputdate = new Date(inputDate);
  const today = new Date();
  if (inputdate >= today) {
    return true;
  } else {
    return false;
  }
}

const couponCreation = async (req, res) => {
  try {
    const { couponName, couponValue, expiryDate, maxValue, minValue } =
      req.body;
    const isValidexpiryDate = expiryDate;
    const isValidDate = dateValidation(isValidexpiryDate);
    if (!isValidDate) {
      res.render("admin/add-coupen", { message: "Enter a valid date" });
    } else if (!(Number(couponValue) > 0)) {
      res.render("admin/add-coupen", { message: "Enter a valid value" });
    } else if (Number(minValue) > Number(maxValue)) {
      res.render("admin/add-coupen", {
        message: "Minimum value should be less than Maximum value",
      });
    } else {
      const couponDetails = new coupencollection({
        couponName: couponName,
        couponValue: couponValue,
        expiryDate: expiryDate,
        maxValue: maxValue,
        minValue: minValue,
      });
      await couponDetails.save();
      res.redirect("/admin/coupons");
    }
  } catch (error) {
    res
      .status(500)
      .render("admin/coupon", {
        message: "Coupon Already Existing....",
        admin: req.session.admin,
      });
  }
};

const couponsRemove = async (req, res) => {
  try {
    const couponId = req.params.id;
    await coupencollection.findByIdAndDelete(couponId);
    res.json("successfully removed");
  } catch (error) {
    res.status(500).json("error by the server side");
  }
};

//banner

const banner = async (req, res) => {
  try {
    if (req.session.admin) {
      const bannerData = await bannrcollection.find();
      res.render("admin/banners", { admin: false, bannerData });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("error from the banner:" + error);
    res.status(500).send("bannerRendering Error");
  }
};

const add_banner = (req, res) => {
  try {
    const admin = false;
    res.render("admin/add-banner", { admin });
  } catch (error) {
    console.log("error from the add_banner" + error);
    res.status(500).send("bannerAddingPage Rendering Error");
  }
};

const add_bannerPost = async (req, res) => {
  console.log("i am the add banner");
  const files = req.files;
  const { name, discription } = req.body;

  const banner = {
    name: name,
    description: discription,
    image: files.map((file) => file.filename),
    availability: true,
  };

  await bannrcollection.create(banner);
  res.redirect("/admin/banners");
};

const bannerRemove = async (req, res) => {
  try {
    const bannerId = req.params.id;
    await bannrcollection.findByIdAndDelete(bannerId);
    // res.json("successfully removed");
    res.redirect("/admin/banners");
  } catch (error) {
    res.status(500).json("error by the server side");
  }
};

module.exports = {
  dashboard,
  graph,
  graphcategory,
  productCountGraph,
  salesReport,

  login,
  login_post,
  adminLogout,

  users,
  user_search,
  userblocking,
  userUnBlocking,

  category,
  create_category,
  create_category_post,
  edit_categories,
  categoryEditpost,
  listCategory,
  unlistCategory,

  products,
  add_product,
  add_product_post,
  edit_product,
  editproduct_post,
  search_product,
  prodUnlist,
  prodlist,
  productDelete,

  orderList,
  orderDetails,
  orderstatus,

  couponsList,
  couponsAdding,
  couponCreation,
  couponsRemove,

  banner,
  add_banner,
  add_bannerPost,
  bannerRemove,
};
