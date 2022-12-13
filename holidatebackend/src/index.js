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
// console.log(path.join(__dirname, "../../holidate/dist"))
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
// console.log(path.join(__dirname, "../../holidate/public/index.html"))

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
        // console.log(req.body);
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
                // console.log(user);

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
    console.log("this is request body filter for app put ",req.body.filter);
    console.log("user id ", req.body.userid);
    try{
        Register.find({ $and : [ { occasion  : { $in :  req.body.filter  }}, { _id : { $ne : req.body.userid } } ] },(err, user) =>{
            // { filter : 0 , password : 0, email : 0}, unable to set it to the query
            if (err) return res.status(500).json({
                title: "server error",
                error: err
            })

            if (!user) {
                return res.status(401).json({
                    title: "no match find",
                    error: "try adding different filters"
                })
            }

            else{
                // console.log("user file", user);
                return res.status(201).json({
                    userdata : user
                })
            }
        })
    } catch(err){ 
        console.log("error in finding data");
    }
    // let posts = Register.find({ _id : "6383cad6beaa16767866d328"}, function(err, posts){
    //     if(err){
    //         console.log(err);
    //     }
    //     else {
    //         res.send(posts);
    //         //console.log("this is request body for app get ",req.body);
    //     }
    // });
    // console.log(posts);
});


app.post("/api/file", upload.single("file"), (req, res, next) => {
    // console.log("this is request body for app post ",req.body);
    const file = req.file;
    // console.log(file.filename);
    if (!file) {
        return res.status(400).json({
            title: "image upload failed",
            error: "please upload a file"
        })
    }
    res.send(file)
    // console.log(path.join(__dirname + "/uploads/" + req.file.filename))
    // console.log(req.file.path);
    const imgObj = {
        image: {
            data : fs.readFileSync(req.file.path),
            contentType : "image/jpg"
        }
    }
    // console.log("this is userid", req.body.userid);
    // console.log(req.file);

    const updateUserData = async (_id) => {
        try {
            await Register.updateOne({ _id }, { $set: { image : imgObj.image } })  
            // console.log(result);
        } catch (err) {
            console.log(err);
        }
    }

    updateUserData(req.body.userid);

})


app.post("/api/occasion", async (req, res) => {
    // console.log(req.body);
    try {
        // res.status(200).json({
        //     title: "data updated successfully"
        // })
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

        // console.log(result);
    } catch (err) {
        console.log(err);
        res.status(400).json({
            title: "error",
        })
    }
})

app.put("/api/connection", (req, res)=>{
    console.log(req.body);
    // Register.updateOne({ _id }, { $set: { image : imgObj.image } }) 
    const updateUserConnections = async (_id) => {
        try {
            const result = await Register.updateOne({ _id }, { $set: { connections : req.body.userconnections } })  
            console.log(result);
        } catch (err) {
            console.log(err);
        }
    }

    updateUserConnections(req.body.userid);
    // Register.updateOne({ _id : req.body.userid }, { $set : { connections : req.body.userconnections } }) ; 
    
    console.log("user id   ", req.body.userid);
    Register.find( { _id : req.body.connectUserID }, { image : 0 }, (err, user)=>{
        if (err) return res.status(500).json({
            title: "server error",
            error: err
        })

        // if (!user) {
        //     return res.status(401).json({
        //         title: "no match find",
        //         error: "try adding different filters"
        //     })
        // }

        else{
            // console.log( "user is : ", user);
            console.log(" this is user connections", user[0].connections)
            for(let i = 0; i <  user[0].connections.length ; i++){

                if(user[0].connections[i] == req.body.userid){

                    const updateUserMatch = async (_id) =>{
                        await Register.updateOne({ _id }, { $addToSet : { match :  req.body.connectUserID }  }); 
                    }
                    const updateConnectUserMatch = async (_id) => {
                        await Register.updateOne({ _id }, { $addToSet : { match :  req.body.userid }  });
                        // console.log(result);
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
    // console.log(req.body);
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
    console.log("reset match user id", req.body.userid);
    Register.findOne({ _id : req.body.userid }, (err, user)=>{     //finding user id
        if(err) console.log(err);
        if(!user) console.log("invalid object id");
        else{
            let userMatchArr = user.match;                  //match array of the user
            console.log("User Match array: ", userMatchArr);

            userMatchArr.forEach(element => {                                 //traversing all the object Ids of the match array of the user
                Register.findOne({ _id : element}, (err, matchUser)=>{        //finding connected users
                    if(err) console.log("error finding element", err);
                    if(!matchUser) console.log("object id not found");
                    else{
                        let connectedUserMatchArr = matchUser.match ;         //match array of connected users
                        console.log("Before splicing", connectedUserMatchArr);
                        let indexOfUser = connectedUserMatchArr.indexOf(req.body.userid);        //index of user in match array of connected users
                        connectedUserMatchArr.splice(indexOfUser, 1);                  //removing it
                        console.log("After splicing", connectedUserMatchArr)

                        const updateConnectedUserMatchArr = async (_id) => {
                            try {
                                const result = await Register.updateOne({ _id }, { $set: { match : connectedUserMatchArr } })  
                                console.log("modification successful", result);
                            } catch (err) {
                                console.log(err);
                            }
                        }
                    
                        updateConnectedUserMatchArr(element);    //update the match array with the modified one 
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

// console.log("directory name  :", __dirname);

app.listen(3000, () => {
    console.log("server is listening to port 3000");
});

