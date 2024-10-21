const mongoose = require('mongoose');
const userSchema = require('./schemas/userSchema');
const classSchema = require('./schemas/classSchema');
const verifySchema = require('./schemas/verifySchema');
const reserveSchema = require('./schemas/reserveSchema');
const likeSchema = require('./schemas/likeSchema');
const storySchema = require('./schemas/storySchema');

// Schema 모델링 exports
exports.User = mongoose.model('User', userSchema);
exports.Class = mongoose.model('Class', classSchema);
exports.Verify = mongoose.model('Verify', verifySchema);
exports.Reserve = mongoose.model('Reserve', reserveSchema);
exports.Like = mongoose.model('Like', likeSchema);
exports.Story = mongoose.model('Story', storySchema);