const express = require("express");
const cors = require("cors")
const PORT = process.env.PORT || 5000;
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes")
const restaurantRoutes = require("./routes/restaurant")
const bookingRoutes = require("./routes/booking")


const app = express();
app.use(cors({origin: true}))
app.use(express.json())


mongoose.connect(
    "mongodb://localhost/restaurant-booking-app",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
).then(() => {
    console.log(`DB Connected!`);
}).catch(err => {
    console.log(`DB Connection Error!`);
    process.exit(1)
});


app.use("/auth", authRoutes)
app.use("/restaurants", restaurantRoutes)
app.use("/bookings", bookingRoutes)



// Express Error Middleware
app.use((err, req, res, next) => {
    console.log(err);
    return res.status(500).json({
        status: "fail",
        message: err.message
    })
})


app.listen(PORT, () => {
    console.log(`Service at ${PORT}`);
});
