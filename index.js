const express=require("express")
const [Hotelroute]=require("./model/bookingmodel")
const [connection]=require("./Database/db")
const app=express()
app.use(express.json())

app.use("/",Hotelroute)





app.listen(3000,()=>{
    try {
        connection()
        console.log("connected to db")
    } catch (error) {
        console.log(error);
    }
})