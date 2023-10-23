var mongoose = require("mongoose");

var addressSchema = mongoose.Schema({
    city : String,
    state : String,
    pincode : String
});

var hospitalSchema = mongoose.Schema({
    name : String,
    phone : String,
    email : {
        type : String,
        unique : true
    },
    address : addressSchema,
    password : String
});

var Hospital = mongoose.model("Hospital", hospitalSchema);
module.exports = Hospital;