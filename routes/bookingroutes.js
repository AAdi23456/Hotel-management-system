const express = require("express")
const [Booking] = require("../model/bookingmodel")
const Hotelroute = express.Router()

const mongoose = require("mongoose")
Hotelroute.post("/book", async (req, res) => {
    try {
        const { guest_name, checkin_date, checkout_date, room_type } = req.body;
        const existing = await Booking.findOne({
            room_type,
            $or: [
                { checkin_date: { $gte: checkin_date, $lt: checkout_date } },
                { checkout_date: { $gt: checkin_date, $lte: checkout_date } },
            ],
        });
        if (existing) {
            return res.status(400).json({ "msg": " room is not available" })
        }
        const availableroom = await Booking.findOne({ room_type, checkin_date: null })
        if (!availableroom) {
            return res.status(400).json({ "msg": " room is not available in selected type" })
        }
        availableroom.guest_name = guest_name;
        availableroom.checkin_date = checkin_date;
        availableroom.checkout_date = checkout_date;
        await availableroom.save();
        res.status(200).json({ "msg": "Room booked." })
    } catch (error) {
        res.status(500).json({ "msg": error })
    }
})
Hotelroute.get("/booking/:id", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
        if (!booking) {
            return res.status(400).json({ "msg": "Booking not found" })
        }
        res.status(200).json({ "data": booking })
    } catch (error) {
        res.status(500).json({ "msg": error })
    }
})
Hotelroute.get("/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find()
        res.status(200).json({ "data": bookings })
    } catch (error) {
        res.status(500).json({ "msg": error })
    }
})

Hotelroute.put("/booking/:id", async (req, res) => {
    try {
        const { guest_name, checkin_date, checkout_date, room_type } = req.body;
        const booking = await Booking.findById(req.params.id)
        if (!booking) {
            return res.status(400).json({ "msg": "Booking not found" })
        }
        const existing = await Booking.findOne({
            room_type,
            $or: [
                { checkin_date: { $gte: checkin_date, $lt: checkout_date } },
                { checkout_date: { $gt: checkin_date, $lte: checkout_date } },
            ],
            _id: { $ne: req.params.id }
        });
        if (existing) {
            return res.status(400).json({ "msg": "Room is already booked" })
        }
        booking.guest_name = guest_name;
        booking.checkin_date = checkin_date;
        booking.checkout_date = checkout_date;
        booking.room_type = room_type;
        await booking.save();
        res.status(200).json({ "msg": "Booking updated successfully" })
    } catch (error) {
        res.status(400).json(error)
    }
})
Hotelroute.delete("/booking/:id", async (req, res) => {
    try {
        const sbooking = await Booking.findById(req.params.id)
        if (sbooking) {
            const booking = await Booking.findByIdAndDelete(req.params.id)
            return res.status(200).send({ "msg": "data delted successfully" })
        }
        else {
            return res.status(400).send({ "msg": "data not found" })
        }

    } catch (error) {
        res.status(500).json({ "msg": error })
    }
})
Hotelroute.get("/bookings/date-range", async (req, res) => {
    try {
        const { checkin_date, checkout_date } = req.query
        const checkinDte = new Date(checkin_date);
        const checkoutDte = new Date(checkout_date);
        const bookings = await Booking.aggregate([
            {
                $match: {
                    $or: [
                        {
                            $and: [
                                { checkin_date: { $gte: checkinDte } },
                                { checkin_date: { $lte: checkoutDte } },
                            ],
                        },
                        {
                            $and: [
                                { checkout_date: { $gte: checkinDte } },
                                { checkout_date: { $lte: checkoutDte } },
                            ],
                        },
                        {
                            $and: [
                                { checkin_date: { $lte: checkinDte } },
                                { checkout_date: { $gte: checkoutDte } },
                            ]
                        }
                    ]
                }
            }
        ])
        res.status(200).json({ data: bookings })
    } catch (error) {
        res.status(400).json(error)
    }
})

Hotelroute.get("/earnings/date-range",async(req,res)=>{
    try {
        const {checkin_date,checkout_date}=req.query
        const checkinDte=new Date(checkin_date);
        const checkoutDte=new Date(checkout_date);
        const bookings=await Booking.find({
            $or:[
                {
                    $and:[
                        {checkin_date:{$gte:checkinDte}},
                        {checkin_date:{$lte:checkoutDte}},
                    ],
                },
                {
                    $and:[
                        {checkout_date:{$gte:checkinDte}},
                        {checkout_date:{$lte:checkoutDte}},
                    ],

                },
                {
                    $and:[
                        {checkin_date:{$lte:checkinDte}},
                        {checkout_date:{$gte:checkoutDte}},
                    ],
                },
            ],
        });
        let totalearnings=0
        bookings.forEach((booking)=>{
            const checkin=new Date(booking.checkin_date);
            const checkout=new Date(booking.checkout_date);
            const numdays=Math.floor((checkout-checkin)/(1000*60*60*24));
            const numrooms=booking.rooms.length
            const roomtype=booking.room_type;
            const earningprbooking=calculate(roomtype,numdays,numrooms)
            totalearnings+=earningprbooking
        })
res.status(200).json({"data":totalearnings})
    } catch (error) {
        res.status(400).json(error)
    }
})

function calculate(room_type,numdays,numrooms){
    const costprday={
        Standard:1200,
        Premium:2300,
        Deluxe:4500
    }
    const costsprday=costprday[room_type];
    const totalcost=costsprday*numdays*numrooms
    return totalcost
}

Hotelroute.get("/top_2_star_users",async(req,res)=>{
    try {
        const ress=await Booking.aggregate([
            {$group:{_id:`$user`,totabookings:{$sum:1}}},
            {$sort:{totabookings:-1}},
            {$limit:2}
        ])
        const top2users=ress.map(item=>item._id.name)
        res.status(200).send({"data":top2users})
    } catch (error) {
        res.status(400).send({"data":error})
    }
})

Hotelroute.get("/top_booking",async(req,res)=>{
    try {
        const rss=await Booking.aggregate([
            {
                $addFields:{
                    earnings:{
                        $multiply:[
                            {$subtract:["$checkout_date","$checkin_date"]},
                            {
                                $switch:{
                                    branches:[
                                        {case:{$eq:["$room_type","Standars"]},then:1200},
                                        {case:{$eq:["$room_type","Premium"]},then:2300},
                                        {casre:{$eq:["room_type","Deluxe"]},then:4650}

                                    ],
                                    default:0
                                }
                            }
                        ]
                    }
                }
            },
            {$sort:{earnings:-1}},
            {$limit:1}
        ])
        res.status(200).json({"data":rss[0]})
    } catch (error) {
        return res.status(400).json({"msg":error})
    }
})
module.exports=[Hotelroute]