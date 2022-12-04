const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://holidateuser:password@drowssap@cluster0.nsua80r.mongodb.net/holidateusers?retryWrites=true&w=majority").then(()=>{
    console.log("connection established");
}).catch((err)=>{
    console.log(err);
})

