const mongoose = require('mongoose');
const userSchema = require('./schemas/userSchema');
const classSchema = require('./schemas/classSchema');

// Schema 모델링 exports
exports.User = mongoose.model('User', userSchema);
exports.Class = mongoose.model('Class', classSchema);