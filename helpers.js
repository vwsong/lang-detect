var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
var _ = require('underscore');
var fs = require('fs');
var nGram = require('n-gram');
var mongoose = require('mongoose');
var dotenv = require('dotenv');
var Language = require('./models/language.js');

var globalLanguages = {};

function lang(res, sample) {
    if (sample.length > 700) {
        Language.find({}, function(err, languages) {
            if (err) throw err;
            else {
                let hiscore = 100000000000000000; //a really big number
                var closestLang = "N/A";
                for (let i = 0; i < languages.length; i++) {
                    console.log(languages[i].language);
                    var currentProfile = languages[i].profile;
                    var sampleProfile = createProfile(sample);
                    var newscore = calculateDifference(currentProfile, sampleProfile);
                    console.log("newscore: " + newscore);
                    console.log("hiscore: " + hiscore);
                    if (hiscore > newscore) {
                        hiscore = newscore;
                        closestLang = languages[i].language;
                    }
                }

                res.render('first', {
                    language: closestLang
                });
            }
        });
    } else {
        res.render('first', {
            language: "Data size too small ☹️ "
        });
    }
}

function langAPI(res, sample) {
    if (sample.length < 700) {
        Language.find({}, function(err, languages) {
            if (err) throw err;
            else {
                let hiscore = 100000000000000000; //a really big number
                var closestLang = "N/A";
                for (let i = 0; i < languages.length; i++) {
                    console.log(languages[i].language);
                    var currentProfile = languages[i].profile;
                    var sampleProfile = createProfile(sample);
                    var newscore = calculateDifference(currentProfile, sampleProfile);
                    console.log("newscore: " + newscore);
                    console.log("hiscore: " + hiscore);
                    if (hiscore > newscore) {
                        hiscore = newscore;
                        closestLang = languages[i].language;
                    }
                }

                res.json({
                    language: closestLang
                });
            }
        });
    } else {
        res.json({
            language: "Data size too small ☹️ "
        });
    }
}

function trainAPI(res, data, language) {
    Language.find({
        language: language
    }, function(err, result) {
        if (err) res.send("find messed up");
        else if (result == undefined || result.length == 0) {
            console.log(result);
            res.json({
                language: "Language not found! ☹️ "
            });
        } else {
            version = result[0].version + 1;
            newData = createProfile(data);
            oldData = result[0].profile;
            category = result[0].category;
            updatedData = processData(newData, oldData);

            var addToGlobal = {
                language: language,
                size: updatedData.length,
                version: version,
                original: false,
                category: category,
                profile: updatedData
            }

            globalLanguages[language] = addToGlobal;

            var lang = new Language({
                language: language,
                size: updatedData.length,
                version: version,
                original: false,
                category: category,
                profile: updatedData
            });
            Language.findOneAndRemove({
                language: language
            }, function(err, todo) {
                lang.save(function(err) {
                    if (err) console.log("Failed to push updated" + language + " data to MongoDB")
                    else {
                        console.log("Successfully pushed updated" + language + " data to MongoDB.");
                    }
                    res.json({
                        language: "Thanks for your contribution! 🤑"
                    });
                });
            });
        }
    });
}

function train(res, data, language) {
    if (data.length < 700) {
        res.render('train', {
            language: "Data size is too small ☹️ "
        });
    } else {
        Language.find({
            language: language
        }, function(err, result) {
            if (err) res.send("find messed up");
            else if (result == undefined || result.length == 0) {
                console.log(result);
                res.render('train', {
                    language: "Language not found! ☹️ "
                });
            } else {
                version = result[0].version + 1;
                newData = createProfile(data);
                oldData = result[0].profile;
                category = result[0].category;
                updatedData = processData(newData, oldData);

                var addToGlobal = {
                    language: language,
                    size: updatedData.length,
                    version: version,
                    original: false,
                    category: category,
                    profile: updatedData
                }

                globalLanguages[language] = addToGlobal;

                var lang = new Language({
                    language: language,
                    size: updatedData.length,
                    version: version,
                    original: false,
                    category: category,
                    profile: updatedData
                });
                Language.findOneAndRemove({
                    language: language
                }, function(err, todo) {
                    lang.save(function(err) {
                        if (err) console.log("Failed to push updated" + language + " data to MongoDB")
                        else {
                            console.log("Successfully pushed updated" + language + " data to MongoDB.");
                        }
                        res.render('train', {
                            language: "Thanks for your contribution! 🤑"
                        });
                    });
                });
            }
        });
    }
}

function addAPI(res, data, language, category, origin, contributor) {
    Language.find({
        language: language
    }, function(err, result) {
        if (err) res.send("find messed up");
        else if (result == undefined || result.length == 0) {
            var newData = createProfile(data);

            var lang = new Language({
                language: language,
                size: newData.length,
                version: 0,
                original: true,
                category: category,
                origin: origin,
                contributor: contributor,
                profile: newData
            });

            var addToGlobal = {
                language: language,
                size: newData.length,
                version: 0,
                original: true,
                category: category,
                origin: origin,
                contributor: contributor,
                profile: newData
            };

            lang.save(function(err) {
                if (err) console.log("Failed to push updated " + language + " data to MongoDB")
                else {
                    globalLanguages[language] = addToGlobal;
                    console.log("Successfully pushed new " + language + " data to MongoDB.");
                }
                res.json({
                    language: "Thanks for your contribution! 🤑"
                });
            });
        } else {
            res.json({
                language: "Language already exists! ☹️"
            });
        }
    });
}

function addLang(res, data, language, category, origin, contributor) {
    if (data.length < 700) {
        res.render('addpage', {
            language: "Data size is too small ☹️ "
        });
    } else {
        Language.find({
            language: language
        }, function(err, result) {
            if (err) res.send("find messed up");
            else if (result == undefined || result.length == 0) {
                var newData = createProfile(data);

                var lang = new Language({
                    language: language,
                    size: newData.length,
                    version: 0,
                    original: true,
                    origin: origin,
                    contributor: contributor,
                    category: category,
                    profile: newData
                });

                var addToGlobal = {
                    language: language,
                    size: newData.length,
                    version: 0,
                    original: true,
                    category: category,
                    origin: origin,
                    contributor: contributor,
                    profile: newData
                };

                lang.save(function(err) {
                    if (err) console.log("Failed to push updated " + language + " data to MongoDB")
                    else {
                        globalLanguages[language] = addToGlobal;
                        console.log("Successfully pushed new " + language + " data to MongoDB.");
                    }
                    res.render('addpage', {
                        language: "Thanks for your contribution! 🤑"
                    });
                });
            } else {
                res.render('addpage', {
                    language: "Language already exists! ☹️"
                });
            }
        });
    }

}

function limitProfiles(globalCopy) {
    gCopy = globalCopy;
    _.mapObject(gCopy, function(v) {
        var prof = v.profile;
        prof = prof.splice(0, 31);
        v.profile = prof;
    });

    return gCopy;
}

function calculateDifference(current, sample) {
    let k = 3000;
    let hiscore = 0;
    for (let i = 0; i < 20; i++) {
        let curr = sample[i].ngram;
        let currscore = _.findIndex(current, function(n) {
            return curr == n.ngram;
        });
        if (currscore == -1) {
            currscore = k;
        }
        console.log(currscore);
        hiscore += Math.abs(i - currscore);
    }

    return hiscore;
}

function purifyString(data) {
    data = data.replace(/[0-9]/g, '');
    data = data.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    data = data.toLowerCase();
    data = data.replace(/\s+/g, " ");
    data = " " + data + " ";

    return data;
}

function mapToSorted(map) {
    var sorted = [];

    for (let key of map.keys()) {
        sorted.push({
            ngram: key,
            value: map.get(key)
        });
    }

    sorted.sort(function(a, b) {
        if (a.value > b.value) return -1;
        else if (a.value < b.value) return 1;
        return 0;
    });

    return sorted;
}

function processData(newData, oldData) {
    var newMap = new Map();
    var oldMap = new Map();

    for (var i = 0; i < oldData.length; i++) {
        oldMap.set(oldData[i].ngram, oldData[i].value);
    }

    for (var i = 0; i < newData.length; i++) {
        var datapoint = newData[i];
        var ngram = datapoint.ngram;
        var count = datapoint.value;

        if (oldMap.has(ngram)) { //if profile[item] exists, increment it
            var curr = oldMap.get(ngram) + count;
            oldMap.set(ngram, curr);
        } else oldMap.set(ngram, count); //else set it to 1
    }

    return mapToSorted(oldMap);
}

function createProfile(data) {
    var setOfNGrams = new Set();
    var engProfile = new Map();
    var sorted = [];
    data = purifyString(data);

    setOfNGrams.add(nGram(2)(data));
    setOfNGrams.add(nGram(3)(data));
    setOfNGrams.add(nGram(4)(data));
    setOfNGrams.add(nGram(5)(data));

    for (let item of setOfNGrams.values()) {
        for (let elem of item) {
            if (engProfile.has(elem)) { //if profile[item] exists, increment it
                var curr = engProfile.get(elem) + 1;
                engProfile.set(elem, curr);
            } else engProfile.set(elem, 1); //else set it to 1
        }
    }

    sorted = mapToSorted(engProfile);

    return sorted;
}

function initialLoad() {
    var langAbvs = {
        "czc.txt": "Czech",
        "dns.txt": "Danish",
        "dut.txt": "Dutch",
        "eng.txt": "English",
        "frn.txt": "French",
        "ger.txt": "German",
        "grk.txt": "Greek",
        "hng.txt": "Hungarian",
        "itn.txt": "Italian",
        "jpn.txt": "Japanese",
        "lat.txt": "Latvian",
        "lit.txt": "Lithuanian",
        "ltn.txt": "Latin",
        "lux.txt": "Luxembourgish",
        "mls.txt": "Maltese",
        "por.txt": "Portuguese",
        "rmn1.txt": "Romani",
        "rum.txt": "Romanian",
        "rus.txt": "Russian",
        "spn.txt": "Spanish",
        "ukr.txt": "Ukranian",
        "yps.txt": "Yapese"
    }
    var langCategory = {
        "czc.txt": "Indo-European",
        "dns.txt": "Germanic",
        "dut.txt": "Indo-European",
        "eng.txt": "Romance",
        "frn.txt": "Romance",
        "ger.txt": "Germanic",
        "grk.txt": "Indo-European",
        "hng.txt": "Uralic",
        "itn.txt": "Romance",
        "jpn.txt": "Japonic",
        "lat.txt": "Indo-European",
        "lit.txt": "Indo-European",
        "ltn.txt": "Romance",
        "lux.txt": "Indo-European",
        "mls.txt": "Afro-Asiatic",
        "por.txt": "Romance",
        "rmn1.txt": "Romance",
        "rum.txt": "Romance",
        "rus.txt": "Indo-European",
        "spn.txt": "Romance",
        "ukr.txt": "Indo-European",
        "yps.txt": "Austronesian"
    }
    var langOrigin = {
        "czc.txt": "Europe",
        "dns.txt": "Europe",
        "dut.txt": "Europe",
        "eng.txt": "Europe",
        "frn.txt": "Europe",
        "ger.txt": "Europe",
        "grk.txt": "Europe",
        "hng.txt": "Europe",
        "itn.txt": "Europe",
        "jpn.txt": "Asia",
        "lat.txt": "Europe",
        "lit.txt": "Europe",
        "ltn.txt": "Europe",
        "lux.txt": "Europe",
        "mls.txt": "Africa",
        "por.txt": "Europe",
        "rmn1.txt": "Europe",
        "rum.txt": "Europe",
        "rus.txt": "Europe",
        "spn.txt": "Europe",
        "ukr.txt": "Europe",
        "yps.txt": "Asia"
    }
    fs.readdir("langs", 'utf8', (err, files) => {
        files.forEach(file => {
            if (!file.startsWith(".")) {
                var langData = fs.readFileSync("langs/" + file, "utf-8");
                var language = langAbvs[file];
                langData = createProfile(langData);
                var lang = new Language({
                    language: language,
                    size: langData.length,
                    version: 0,
                    original: true,
                    category: langCategory[file],
                    origin: langOrigin[file],
                    contributor: "Vincent Song",
                    profile: langData
                });

                lang.save(function(err) {
                    if (err) console.log("Failed to push " + language + " data to MongoDB")
                    else console.log("Successfully pushed " + language + " data to MongoDB.");
                });
            }
        });
    });
}

module.exports = {
    langAPI: langAPI,
    trainAPI: trainAPI,
    lang: lang,
    train: train,
    addLang: addLang,
    addAPI: addAPI,
    limitProfiles: limitProfiles,
    processData: processData,
    calculateDifference: calculateDifference,
    purifyString: purifyString,
    mapToSorted: mapToSorted,
    createProfile: createProfile,
    initialLoad: initialLoad,
    globalLanguages: globalLanguages
};
