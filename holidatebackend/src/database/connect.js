const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/holidateusers").then(()=>{
    console.log("connection established");
}).catch((err)=>{
    console.log(err);
})

