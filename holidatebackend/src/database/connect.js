const mongoose = require("mongoose");

// mongoose.connect("mongodb+srv://holidateuser:8xMsvLBfbJIKOuGB@cluster0.nsua80r.mongodb.net/holidateusers?retryWrites=true&w=majority").then(()=>{
//     console.log("connection established");
// }).catch((err)=>{
//     console.log(err);
// })

mongoose.connect("mongodb://localhost:27017/holidateusers").then(()=>{
    console.log("connection established");
}).catch((err)=>{
    console.log(err);
})

