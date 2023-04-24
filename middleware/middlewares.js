const jwt = require('jsonwebtoken');

const checkAuth = (req, res, next) => {
    const token = req.cookies.userLoggedIn;

    if(token) {
        jwt.verify(token, process.env.PRIVATE_KEY, (err, decodedToken) => {
            if(err) {
                res.redirect("/");
            } else {
                next();
            }
        })
    } else {
        res.redirect("/")
    }
}

module.exports = checkAuth;