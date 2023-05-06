const mongoose=require("mongoose")

const bookingschem=new mongoose.Schema({
    guest_name:{type :String,required:true},
    checkin_data:{type:Date,required:true},
    checkout_date:{type:Date,required:true},
    room_type:{type :String,required:true,enum:["Standard","Premium","Deluxe"]},
    room_Number:{type :Number,required:true}
});
const Booking=mongoose.model("Booking",bookingschem)

module.exports=[Booking]