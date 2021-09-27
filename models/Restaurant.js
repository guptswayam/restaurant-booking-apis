const mongoose = require("mongoose")

const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: "Point"
    },
    coordinates: {
        type: [Number],        
        default: undefined,    
        required: true,
    }
}, {_id: false});

const restaurantSchema = new mongoose.Schema({
    geoPoint: {
        type: pointSchema,
        required: true
    },

    name: {
        required: true,
        type: String
    },

    city: {
        required: true,
        type: String
    },

    pincode: {
        required: true,
        minlength: 6,
        maxlength: 6,
        type: String
    },

    status: {
        type: String,
        enum: ["OPEN", "CLOSED"],
        default: "CLOSED"
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    tables: {
        type: Number,
        default: 10
    },

    tableAmount: {
        type: Number,
        default: 500
    }

})

restaurantSchema.set("timestamps", true)

const Restaurant = mongoose.model("restaurants", restaurantSchema)

module.exports = Restaurant