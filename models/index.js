const mongoose = require('mongoose');
const userSchema = require('./schemas/userSchema');

// Schema 모델링 exports
exports.User = mongoose.model('User', userSchema);