const Restaurant = require("./../models/Restaurant")

exports.create = async (data, user) => {
    const restaurant = await Restaurant.create({...data, userId: user._id})
    return restaurant;
}

exports.getAll = async () => {
    const restaurants = await Restaurant.find()

    return restaurants
}