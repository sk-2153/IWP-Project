var mongoose = require("mongoose");

var orderSchema = mongoose.Schema({
    postID : mongoose.Schema.Types.ObjectId,
    hospitalID : mongoose.Schema.Types.ObjectId,
    userID : mongoose.Schema.Types.ObjectId,
    quantity : Number,
});

var Order = mongoose.model("Order",orderSchema);
module.exports = Order;