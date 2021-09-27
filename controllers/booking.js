const moment = require("moment");
const Booking = require("../models/Booking")

exports.create = async (data, user) => {
    if(!data.restaurantId || !data.tablesCount || !data.bookingStartTime || !data.durationInHours)
        throw new Error("Invalid Body!")

    const booking = await Booking.create({...data, userId: user._id, bookingEndTime: moment(data.bookingStartTime).add(data.durationInHours, "hours").toDate()})

    return booking;
}

exports.getAll = async (params={}) => {
    return Booking.find(params);
}

console.log(new Date().toISOString())