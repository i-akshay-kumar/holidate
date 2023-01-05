const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "../../holidate/dist")))

require("./database/connect");
const Register = require("./models/register");
const { default: mongoose } = require('mongoose');


//setting up storage for user images
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "uploads");
    },
    filename: (req, file, callback) => {
        callback(null, path.parse(file.originalname).name + "-" + Date.now() + path.extname(file.originalname)); 
    }
})
var upload = multer({ storage: storage });

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../holidate/public/index.html"));
    console.log(res);
})

app.get("/api/register", (req, res) => {
    res.send("registered user page");
})
app.post("/api/register", async (req, res) => {
    try {
        const registerUser = new Register({
            fullname: req.body.fullname,
            mobilenumber: req.body.mobilenumber,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10)
        })

        const registeredUser = await registerUser.save();
        res.status(200).json({
            title: "user registered successfully"
        })
    } catch (err) {
        res.status(400).json({
            title: "error",
            error: "user already exists"
        })
    }
})


app.post("/api/login", async (req, res) => {
    try {

        Register.findOne({ email: req.body.email }, (err, user) => {
            if (err) return res.status(500).json({
                title: "server error",
                error: err
            })

            if (!user) {
                return res.status(401).json({
                    title: "user not found",
                    error: "invalid credentials", 
                    isInvaidCredential : true 
                })
            }

            //incorrect password

            if (!bcrypt.compareSync(req.body.password, user.password)) {
                return res.status(401).json({

                    title: "login failed",
                    error: "invalid credentials",
                    isInvaidCredential : true 
                })
            }

            //no error
            else {
                return res.status(200).json({
                    title: "login successful", 
                    isAuthUser : true,
                    userData : [user._id, user.fullname]
                })
            }
        })
    } catch (err) {
        console.log(err); 
    }
})

app.put('/api/file', function (req, res) {
    try{
        Register.find({ $and : [ { occasion  : { $in :  req.body.filter  }}, { _id : { $ne : req.body.userid } } ] },(err, user) =>{
            
            if (err) return res.status(500).json({
                title: "server error",
                error: err
            })

            if (!user) {
                return res.status(401).json({
                    title: "no match found",
                    error: "try adding different filters"
                })
            }

            else{
                
                return res.status(201).json({
                    userdata : user
                })
            }
        })
    } catch(err){ 
        console.log("error in finding data");
    }

});


app.post("/api/file", upload.single("file"), (req, res, next) => {

    const file = req.file;
    if (!file) {
        return res.status(400).json({
            title: "image upload failed",
            error: "please upload a file"
        })
    }
    res.send(file)

    const imgObj = {
        image: {
            data : fs.readFileSync(req.file.path),
            contentType : "image/jpg"
        }
    }

    const updateUserData = async (_id) => {
        try {
            await Register.updateOne({ _id }, { $set: { image : imgObj.image } })  
        } catch (err) {
            console.log(err);
        }
    }

    updateUserData(req.body.userid);

})


app.post("/api/occasion", async (req, res) => {
    try {
        await Register.findByIdAndUpdate(req.body.userid, {
            $set : {
                occasion : req.body.occasion, 
                filter : req.body.filter 
            }
        }, 
        {
            new : true,
            useFindAndModify: false
        });

    } catch (err) {
        res.status(400).json({
            title: "error",
        })
    }
})

app.put("/api/connection", (req, res)=>{

    const updateUserConnections = async (_id) => {
        try {
            const result = await Register.updateOne({ _id }, { $set: { connections : req.body.userconnections } })  
            console.log(result);
        } catch (err) {
            console.log(err);
        }
    }

    updateUserConnections(req.body.userid);
    
    Register.find( { _id : req.body.connectUserID }, { image : 0 }, (err, user)=>{
        if (err) return res.status(500).json({
            title: "server error",
            error: err
        })

        else{
            
            for(let i = 0; i <  user[0].connections.length ; i++){

                if(user[0].connections[i] == req.body.userid){

                    const updateUserMatch = async (_id) =>{
                        await Register.updateOne({ _id }, { $addToSet : { match :  req.body.connectUserID }  }); 
                    }
                    const updateConnectUserMatch = async (_id) => {
                        await Register.updateOne({ _id }, { $addToSet : { match :  req.body.userid }  });
                    }
                    updateUserMatch(req.body.userid);
                    updateConnectUserMatch(req.body.connectUserID);

                    return res.status(201).json({
                        title : "connection matched", 
                        isMatch : true, 
                        userinfo : user[0]
                    })
                }
            }

            return res.status(201).json({
                title : "connection not matched", 
                isMatch : false
            })
        }
    });
})

app.put("/api/match", (req, res)=>{
    Register.findOne( { _id  : req.body.userid } , (err, user)=>{
        if(err) console.log(err);
        if(!user) console.log("no user found");
        else{
            let useridmatcharr  = user.match ;
            Register.find( { _id  : { $in : useridmatcharr  } }, (err, user) =>{
                return res.status(201).json({
                title : "match result",
                usermatch : user 
            })
            })
            
        }
    })
})

app.put("/api/resetmatch", (req, res)=>{
    Register.findOne({ _id : req.body.userid }, (err, user)=>{     
        if(err) console.log(err);
        if(!user) console.log("invalid object id");
        else{
            let userMatchArr = user.match;                

            userMatchArr.forEach(element => {                                 
                Register.findOne({ _id : element}, (err, matchUser)=>{       
                    if(err) console.log("error finding element", err);
                    if(!matchUser) console.log("object id not found");
                    else{
                        let connectedUserMatchArr = matchUser.match ;       
                        let indexOfUser = connectedUserMatchArr.indexOf(req.body.userid);       
                        connectedUserMatchArr.splice(indexOfUser, 1);     

                        const updateConnectedUserMatchArr = async (_id) => {
                            try {
                                const result = await Register.updateOne({ _id }, { $set: { match : connectedUserMatchArr } })  
                                console.log("modification successful", result);
                            } catch (err) {
                                console.log(err);
                            }
                        }
                    
                        updateConnectedUserMatchArr(element);    
                    }
                })
            });

            return res.status(201).json({
                title : "connected user's match array reset successfull"
            })
        }
    })
} );

app.delete("/api/deleteuser/:id", async (req, res)=>{
    try{
        console.log("user id delete : ", req.params.id);
        const result = await Register.findByIdAndDelete(req.params.id);
        
        res.send(result);
    }catch(err){
        res.status(500).send(err);
    }
    
})


app.listen(3000, () => {
    console.log("server is listening to port 3000");
});

