const mongoose = require('mongoose');
const userSchema = require('./schemas/userSchema');
const classSchema = require('./schemas/classSchema');
const verifySchema = require('./schemas/verifySchema');

// Schema 모델링 exports
exports.User = mongoose.model('User', userSchema);
exports.Class = mongoose.model('Class', classSchema);
exports.Verify = mongoose.model('Verify', verifySchema);