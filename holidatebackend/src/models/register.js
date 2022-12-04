const mongoose = require("mongoose");

const holidateUserSchema = new mongoose.Schema({
    fullname : {
        type : String, 
        required : true
    }, 

    mobilenumber : {
        type : Number, 
        required : true, 
        unique : true
    }, 

    email : {
        type: String, 
        required : true, 
        unique : true
    }, 

    password : {
        type : String, 
        requried : true
    }, 

    image : {
        data : Buffer, 
        contentType : String
    }, 

    occasion : {
        type : Array
    }, 

    filter : {
        type : Array
    }, 

    connections :{
        type : Array 
    }, 

    match  : { 
        type : Array
    }
})

const Register = new mongoose.model("Register", holidateUserSchema) ; 

module.exports = Register ; 
