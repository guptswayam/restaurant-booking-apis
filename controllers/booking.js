/* 
# IMPORTANT
=> As we know, node js handles requests concurrently, so same function can be executed twice at the same time and may data inconsistency in database
=> We need to synchronise our create booking api otherwise we may end up having more bookings than expected.
=> We have 3 ways to achieve this:- 
1. By Checking and deleting the extra bookings if created after saving/update of booking. 
   In this case, it is possible if two bookings came at the same time and we wouldn't create any booking, although one booking can be processed.
   Possibility of deleting both the bookings after creation is much less, so this is the best approach we have.

2. Using Mutex design pattern:- This pattern only works if we are only running one cluster of node app. Not for distributed system.
   In this pattern, we synchronide our function so it can't be executed concurrently.
   We can push the requests in the queue and process them one by one. So this may increase the waiting time for requests coming at same time.
   We can use promise.then() or simple queue data structure to queue the requests and process them one by one.
   async-mutex is nodejs library which implement mutex pattern under the hood. Although we are not using it and writing mutex logic by own
   https://www.nodejsdesignpatterns.com/blog/node-js-race-conditions/
   https://blog.theodo.com/2019/09/handle-race-conditions-in-nodejs-using-mutex/

3. Using distributed locks:- These are used when we are running the multiple instances/clusters/servers of node app.
   https://www.robertobandini.it/2020/11/29/a-redlock-example-with-node-js-about-how-to-lock-a-key-pair-on-redis/
   https://redis.io/topics/distlock
   https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html

*/

// 1
const moment = require("moment");
const Booking = require("../models/Booking")
const redis = require('redis')
const Redlock = require('redlock')

exports.create = async (data, user) => {
    if(!data.restaurantId || !data.tablesCount || !data.bookingStartTime || !data.durationInHours)
        throw new Error("Invalid Body!")

    const booking = await Booking.create({...data, userId: user._id, bookingEndTime: moment(data.bookingStartTime).add(data.durationInHours, "hours").toDate()})

    return booking;
}



// 2. Mutex pattern to synchronize the resource
let mutex = Promise.resolve()
console.log(mutex.then(data => console.log(data)))          // prints undefined

exports.create1 = async (data, user) => {
    console.log("request hits sucessfully")
    mutex = mutex.then(async () => {
        if(!data.restaurantId || !data.tablesCount || !data.bookingStartTime || !data.durationInHours)
            throw new Error("Invalid Body!")

        const booking = await Booking.create({...data, userId: user._id, bookingEndTime: moment(data.bookingStartTime).add(data.durationInHours, "hours").toDate()})

        return booking;
    }).catch(err => {
        throw err
    })

    return mutex
}


// 3. Distrbutive locking
const redisClient = redis.createClient({
    host: "localhost",
    port: "6379"
})
redisClient.on('error', error =>  console.error(error))
const redlock = new Redlock(
    [redisClient],
    {
        driftFactor: 0.01,
        retryCount:  -1,
        retryDelay:  200,
        retryJitter:  200
    }
)

exports.create2 = async (data, user) => {
    if(!data.restaurantId || !data.tablesCount || !data.bookingStartTime || !data.durationInHours)
        throw new Error("Invalid Body!")
    
    // resource can be very useful when working with distributive locks(or async-mutex) because through resource, we can block our resource based on different keys.
    const resource = `booking-lock:${data.restaurantId}`        // In this case, We only block the resource, if the restaurantId is same otherwise not. So It's a great optimisation
    const ttl = 20000       // 20 seconds

    return new Promise((resolve, reject) => {
        redlock.lock(resource, ttl).then(async function(lock) {
            try {
                console.log("RESOURCE ACQUIRED FOR " + data.restaurantId)
                const booking = await Booking.create({...data, userId: user._id, bookingEndTime: moment(data.bookingStartTime).add(data.durationInHours, "hours").toDate()})
                lock.unlock()
                console.log("RESOURCE RELEASED " + data.restaurantId)
                return resolve(booking)
            } catch (error) {
                console.log("RESOURCE RELEASED " + data.restaurantId)
                lock.unlock()
                return reject(error)
            }
        })
    })
}


exports.getAll = async (params={}) => {
    return Booking.find(params);
}