const {Router} = require("express");
const bookingControllers = require("./../controllers/booking")
const router = Router()

const { isAuthenticated, restrictTo } = require("../utils/middlewares")

router.post("/", isAuthenticated, async (req, res, next) => {

    try {
        const response = await bookingControllers.create2(req.body, req.user)

        res.json(response)

    } catch (error) {
        next(error)
    }
    
})

router.get("/", isAuthenticated, async (req, res, next) => {

    try {
        const response = await bookingControllers.getAll({userId: req.user._id})

        res.json(response)

    } catch (error) {
        next(error)
    }
    
})

module.exports = router