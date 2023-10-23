var express = require('express');
var bodyParser = require("body-parser");
var User = require("./schemas/User.js");
var Hospital = require('./schemas/Hospital.js');
var Post = require("./schemas/Post.js");
var Order = require("./schemas/Order.js");
var handlebars = require("express-handlebars").create({
    defaultLayout: "main"
});
var mongoose = require("mongoose");
var crypto = require("crypto");
const e = require('express');

var app = express();
var port = 3000;
var algorithm = "sha256";
var validatePassword = (password, hash) => {
    if (crypto.createHash(algorithm).update(password).digest('hex') == hash)
        return true;
    else
        return false;
}
var userType = NaN;
var userID = NaN;
var hospitalID = NaN;

//Middleware
app.engine("handlebars", handlebars.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

//Database
mongoose.connect("mongodb+srv://valimaiupdate:devadarshan@covid-cluster.ztg3xa8.mongodb.net/?retryWrites=true&w=majority")
    .then(() => console.log('connected'))
    .catch(e => console.log(e));

//handlers

//get methods

app.get('/', (req, res) => {
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/posts", (req, res) => {
    if (userType == "hospital") {
        Post.aggregate([
            {
                $match: {
                    quantity: {
                        $gt: 0
                    },
                    hospitalID: {
                        $ne: hospitalID
                    }
                }
            },
            {
                $lookup: {
                    from: "hospitals",
                    localField: "hospitalID",
                    foreignField: "_id",
                    as: "post_hospital"
                }
            }
        ], (err, docs) => {
            res.render("posts", {
                data: JSON.parse(JSON.stringify(docs)),
                hospital: true
            })
        })
    }
    else if (userType == "user") {
        Post.aggregate([
            {
                $match: {
                    quantity: {
                        $gt: 0
                    }
                }
            },
            {
                $lookup: {
                    from: "hospitals",
                    localField: "hospitalID",
                    foreignField: "_id",
                    as: "post_hospital"
                }
            }
        ], (err, docs) => {
            res.render("posts", {
                data: JSON.parse(JSON.stringify(docs)),
                hospital: false
            })
        })
    }
    else {
        res.render("illegalAccess");
    }
});

app.get("/post-order", (req, res) => {
    if (userType == "hospital") {
        res.render("postOrder", {
            hospital: true
        });
    }
    else {
        res.render("illegalAccess");
    }
});

app.get("/bookings", (req, res) => {
    var id = userType == "user" ? userID : hospitalID;
    if (userType == "hospital" || userType == "user"){
        Order.aggregate([{
            $match: {
                "userID": mongoose.mongo.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: "posts",
                localField: "postID",
                foreignField: "_id",
                as: "order_post"
            }
        }, {
            $lookup: {
                from: "hospitals",
                localField: "hospitalID",
                foreignField: "_id",
                as: "order_hospital"
            }
        }], (err, docs) => {
            res.render("bookings", {
                data: JSON.parse(JSON.stringify(docs)),
                hospital: userType == "hospital" ? true : false
            });
        });
    }else{
        res.render("illegalAccess");
    }
});

app.get("/orders", (req, res) => {
    if (userType == "hospital" || userType == "user"){
        Order.aggregate([{
            $match: {
                "hospitalID": mongoose.mongo.ObjectId(hospitalID)
            }
        },
        {
            $lookup: {
                from: "posts",
                localField: "postID",
                foreignField: "_id",
                as: "order_post"
            }
        }, {
            $lookup: {
                from: "users",
                localField: "userID",
                foreignField: "_id",
                as: "order_user"
            }
        }, {
            $lookup: {
                from: "hospitals",
                localField: "userID",
                foreignField: "_id",
                as: "order_hospital"
            }
        }], (err, docs) => {
            res.render("orders", {
                data: JSON.parse(JSON.stringify(docs)),
                hospital: userType == "hospital" ? true : false
            });
        });
    }else{
        res.render("illegalAccess");
    }
});

app.get("/api", (req, res) => {
    if (userType == "hospital" || userType == "user"){
        fetch("https://api.apify.com/v2/key-value-stores/toDWvRj1JpTXiM8FF/records/LATEST?disableRedirect=truen")
            .then((response) => response.json())
            .then((data) => res.render("api", {
                data: data,
                hospital : userType == "hospital" ? true : false
            }));

    }else{
        res.render("illegalAccess");
    }
});

app.get("/logout", (req, res) => {
    userType = NaN;
    userID = NaN;
    hospitalID = NaN;
    res.redirect("/login");
})

//Post Methods

app.post("/signup", (req, res) => {
    var { usertype } = req.body;
    if (usertype == "user") {
        var { name, phone, email, password } = req.body;
        User.create({
            name: name,
            phone: phone,
            email: email,
            password: crypto.createHash(algorithm).update(password).digest('hex'),
        }, (err, small) => {
            console.log(err); //Handle this error
        });
    }

    if (usertype == "hospital") {
        var { name, phone, email, inputDistrict, inputState, pincode, password } = req.body;
        Hospital.create({
            name: name,
            phone: phone,
            email: email,
            address: {
                city: inputDistrict,
                state: inputState,
                pincode: pincode
            },
            password: crypto.createHash(algorithm).update(password).digest('hex'),
        }, (err, small) => {
            console.log(err); //Handle this error
        });
    }
    res.redirect("/login");
});

app.post("/login", (req, res) => {
    var { email, password, usertype } = req.body;
    if (usertype == "user") {
        User.findOne({ email: email }, (err, docs) => {
            if (err) {
                console.log(err) //handle error
            }
            else {
                if (docs) {
                    if (validatePassword(password, docs.password)) {
                        userType = usertype;
                        userID = docs._id;
                        res.redirect("/posts");
                    }
                    else {
                        res.send("Password is wrong");
                    }
                }
                else {
                    res.send("User doesn't exist");
                }
            }
        });
    }
    if (usertype == "hospital") {
        Hospital.findOne({ email: email }, (err, docs) => {
            if (err) {
                console.log(err) //handle error
            }

            else {
                if (docs) {
                    if (validatePassword(password, docs.password)) {
                        userType = usertype;
                        hospitalID = docs._id;
                        res.redirect("/posts");
                    }
                    else {
                        res.send("Password is wrong");
                    }
                }
                else {
                    res.send("User doesn't exist");
                }
            }
        });
    }

});

app.post("/post-order", (req, res) => {
    var { resources, description, quantity } = req.body;
    Post.create({
        hospitalID: mongoose.mongo.ObjectId(hospitalID),
        resources: resources,
        description: description,
        quantity: quantity
    }, (err, small) => {
        console.log(err);
    });
    res.redirect("/posts");
});

app.post("/order-post", (req, res) => {
    var id = userType == "user" ? userID : hospitalID;
    var { postId, quantity, total, resources, description } = req.body;
    if (quantity < 1) {
        res.redirect("/posts");
    }
    Post.findOneAndUpdate({ _id: postId }, { quantity: total - quantity }, (err, docs) => {
        if (!err) {
            var { hospitalID } = docs;
            Order.create({
                postID: mongoose.mongo.ObjectId(postId),
                userID: mongoose.mongo.ObjectId(id),
                hospitalID: mongoose.mongo.ObjectId(hospitalID),
                quantity: quantity,
                resources: resources,
                description: description
            }, (err, small) => {
                if (!err) {
                    res.redirect("/posts");
                }
            })
        }
    });
});

app.use((req, res) => {
    res.status(404);
    res.render('notfound');
});

app.listen(port, () => {
    console.log("Logged In");
});