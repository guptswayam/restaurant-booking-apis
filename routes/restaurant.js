const {Router} = require("express");
const restaurantControllers = require("./../controllers/restaurant")
const router = Router()

const { isAuthenticated, restrictTo } = require("../utils/middlewares")

router.post("/", isAuthenticated, restrictTo("admin"), async (req, res, next) => {

    try {
        const response = await restaurantControllers.create(req.body, req.user)

        res.json(response)

    } catch (error) {
        next(error)
    }
    
})

router.get("/", isAuthenticated, async (req, res, next) => {

    try {
        const response = await restaurantControllers.getAll()

        res.json(response)

    } catch (error) {
        next(error)
    }
    
})

module.exports = router