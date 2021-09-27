const User = require("../models/User");
const jwt = require("jsonwebtoken")

exports.isAuthenticated = async (req, res, next) => {
    try {
        const token = req.headers["authorization"].split(" ")[1];

        jwt.verify(token, "secret", async (err, payload) => {
            if (err) {
                return res.status(401).json({ message: err });
            } else {
                const user = await User.findById(payload._id)
                // other authorization logic
                if(!user)
                    return res.status(401).json({message: "Invalid Id!"})
                req.user = user
                next()
            }
        });
    } catch (error) {
        console.log(error)
        return res.status(401).json({message: "UnAuthorised!"})
    }
}

exports.restrictTo = function (...roles) {
    return (req, res, next) => {
        if(roles.includes(req.user.role)){
            next()
        }
        else
            return res.status(403).send("Forbidden!")
    }
}