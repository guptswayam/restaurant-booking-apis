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

    /* This is just for increasing the waiting time, so two requests can access same resource at the same time */
    function waitForSomeTime() {
        return new Promise((resolve) => {
            console.log("waiting...")
            setTimeout(() => {
                console.log("waiting completed...")
                resolve()
            }, 8000)
        })
    }
    
    await waitForSomeTime()
    
    next()

})


// We are using post middleware here to avoid the race conditions for the restaurant table bookings
// bookingSchema.post("save", async function(doc, next) {
//     let tablesBooked = await Booking.aggregate([
//         {
//             $match: {
//                 restaurantId: this.restaurantId,
//                 $or: [
//                     {
//                         bookingStartTime: {$lte: moment(this.bookingStartTime).toDate()},
//                         bookingEndTime: {$gte: moment(this.bookingStartTime).toDate()}
//                     },
//                     {
//                         bookingStartTime: {$gte: moment(this.bookingEndTime).toDate()},
//                         bookingEndTime: {$lte: moment(this.bookingEndTime).toDate()}
//                     }
//                 ]
//             }
//         },
//         {
//             $group: {
//                 _id: null,
//                 tablesBooked: {$sum: "$tablesCount"}
//             }
//         }
//     ])

//     tablesBooked = tablesBooked[0] ? tablesBooked[0].tablesBooked : 0;

//     const restaurant = await Restaurant.findById(this.restaurantId);

//     if(tablesBooked > restaurant.tables) {
//         await Booking.deleteOne({_id: doc._id})
//         return next(new Error("All tables are already booked!"))
//     }

//     next()

// })


const Booking = mongoose.model("bookings", bookingSchema);

module.exports = Booking