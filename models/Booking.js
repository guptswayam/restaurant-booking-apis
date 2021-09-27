const mongoose = require("mongoose");
const moment = require("moment")
const Restaurant = require("./Restaurant");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    amount: {
        type: Number
    },

    tablesCount: {
        type: Number,
        required: true
    },

    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "restaurants",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },

    bookingStartTime: {
        type: Date,
        required: true
    },

    bookingEndTime: {
        type: Date,
        required: true
    }

});

bookingSchema.set("timestamps", true)

bookingSchema.pre("save", async function(next) {
    let tablesBooked = await Booking.aggregate([
        {
            $match: {
                restaurantId: this.restaurantId,
                $or: [
                    {
                        bookingStartTime: {$lte: moment(this.bookingStartTime).toDate()},
                        bookingEndTime: {$gte: moment(this.bookingStartTime).toDate()}
                    },
                    {
                        bookingStartTime: {$gte: moment(this.bookingEndTime).toDate()},
                        bookingEndTime: {$lte: moment(this.bookingEndTime).toDate()}
                    }
                ]
            }
        },
        {
            $group: {
                _id: null,
                tablesBooked: {$sum: "$tablesCount"}
            }
        }
    ])

    tablesBooked = tablesBooked[0] ? tablesBooked[0].tablesBooked : 0;

    const restaurant = await Restaurant.findById(this.restaurantId);
    if(restaurant.tables - tablesBooked <= 0)
        return next(new Error("Tables are unavailable for this Time Period"))

    else if(this.tablesCount > restaurant.tables - tablesBooked){
        return next(new Error(`Only ${restaurant.tables - tablesBooked} table(s) are available for this time period!`))
    }

    else {
        this.amount = restaurant.tableAmount * this.tablesCount
    }
        
    next()
    

})

const Booking = mongoose.model("bookings", bookingSchema);

module.exports = Booking