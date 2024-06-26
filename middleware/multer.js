//multer for the products images upload
const multer =require('multer')




const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp' , 'image/avif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'productImages'); // Destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // Unique filename for each uploaded image
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error(' Only JPG and PNG images are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter });


const banner = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'banner'); // Destination folder for uploaded images
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname); // Unique filename for each uploaded image
      }
    });
  const update = multer({storage: banner});
module.exports = {
    storage,
    upload,
    update,
}