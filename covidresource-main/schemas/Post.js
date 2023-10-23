var mongoose = require("mongoose");

var postSchema = mongoose.Schema({
    hospitalID : mongoose.Schema.Types.ObjectId,
    resources : String,
    quantity : Number,
    description : String
});

var Post = mongoose.model("Post",postSchema);
module.exports = Post;