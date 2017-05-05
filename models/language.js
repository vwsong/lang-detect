var mongoose = require('mongoose');

var profileSchema = new mongoose.Schema({
    ngram: String,
    value: Number
});

var languageSchema = new mongoose.Schema({
    language: String,
    version: 0,
    size: Number,
    original: Boolean,
    category: String,
    origin: String,
    contributor: String,
    profile: [profileSchema]
});

var Language = mongoose.model('language', languageSchema);

module.exports = Language;
