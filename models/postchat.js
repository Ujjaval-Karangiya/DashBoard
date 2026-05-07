const mongoose = require("mongoose");

const postChatSchema = new mongoose.Schema({
    postId: String,          // ID from SQL post
    from: String,
    msg: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("PostChat", postChatSchema);
