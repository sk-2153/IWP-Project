var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
    name : String,
    phone : String,
    email : {
        type : String,
        unique : true
    },
    password : String
});

var User = mongoose.model("User", userSchema);
module.exports = User;