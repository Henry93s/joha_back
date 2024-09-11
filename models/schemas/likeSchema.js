const {Schema} = require('mongoose');

const likeSchema = new Schema({
    class_nanoid: {
        type: String,
        require: true,
        index: true
    },
    user_email: {
        type: String,
        required: true,
        index: true
    }
},{
    timestamps: true
});

module.exports = likeSchema;