const mongoose=require("mongoose")
require("dotenv").config()
 const connection= async ()=>{
  await mongoose.connect(process.env.url)
  console.log("conn")
 }
 module.exports=[connection]