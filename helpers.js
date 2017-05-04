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

    // for (let key of engProfile.keys()) {
    //     sorted.push({
    //         ngram: key,
    //         value: engProfile.get(key)
    //     });
    // }
    //
    // sorted.sort(function(a, b) {
    //     if (a.value > b.value) return -1;
    //     else if (a.value < b.value) return 1;
    //     return 0;
    // });

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
        "lat.txt": "Latvian",
        "lit.txt": "Indo-European",
        "ltn.txt": "Latin",
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
    limitProfiles: limitProfiles,
    processData: processData,
    calculateDifference: calculateDifference,
    purifyString: purifyString,
    mapToSorted: mapToSorted,
    createProfile: createProfile,
    initialLoad: initialLoad
};
