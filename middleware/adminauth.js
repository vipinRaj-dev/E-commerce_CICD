const isAdmin = (req, res, next) => {
    if (req.session.admin) {
       next()
    } else {
        res.render('admin/adminlogin')
    }
}
const isLogOut =(req,res,next)=>{
    if(!req.session.admin){
        res.redirect('/admin/login'); 
    }else{
        next()
    }
}




module.exports = {
    isAdmin,
    isLogOut
}
