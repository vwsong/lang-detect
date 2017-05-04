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
var h = require('./helpers.js');

dotenv.load();

var app = express();
var globalLanguages = {};

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));

/* Add whatever endpoints you need! Remember that your API endpoints must
 * have '/api' prepended to them. Please remember that you need at least 5
 * endpoints for the API, and 5 others.
 */

app.get('/data', function(req, res) {
    res.json(globalLanguages);
});

app.post('/language', function(req, res) {
    if (req.body.sample.length > 900) {
        Language.find({}, function(err, languages) {
            if (err) throw err;
            else {
                let hiscore = 100000000000000000; //a really big number
                var closestLang = "N/A";
                for (let i = 0; i < languages.length; i++) {
                    console.log(languages[i].language);
                    var currentProfile = languages[i].profile;
                    var sampleProfile = h.createProfile(req.body.sample);
                    var newscore = h.calculateDifference(currentProfile, sampleProfile);
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
            language: "Data size too small :("
        });
    }
});

app.post('/train', function(req, res) {
    var data = req.body.sample + " ";
    var language = req.body.name + "";

    Language.find({
        language: language
    }, function(err, result) {
        if (err) res.send("find messed up");
        else if (result == undefined || result.length == 0) {
            console.log(result);
            res.render('train', {
                language: "Language not found! :("
            });
        } else {
            version = result[0].version + 1;
            newData = h.createProfile(data);
            oldData = result[0].profile;
            category = result[0].category;
            updatedData = h.processData(newData, oldData);

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
                        language: "Thanks for your contribution! :)"
                    });
                });
            });
        }
    });
});

function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

app.post("/add", function(req, res) {
    var data = req.body.sample + " ";
    var language = req.body.name;
    var category = req.body.family;

    Language.find({
        language: language
    }, function(err, result) {
        if (err) res.send("find messed up");
        else if (result == undefined || result.length == 0) {
            var newData = h.createProfile(data);

            var lang = new Language({
                language: language,
                size: newData.length,
                version: 0,
                original: true,
                category: category,
                profile: newData
            });

            var addToGlobal = {
                language: language,
                size: newData.length,
                version: 0,
                original: true,
                category: category,
                profile: newData
            };

            lang.save(function(err) {
                if (err) console.log("Failed to push updated " + language + " data to MongoDB")
                else {
                    globalLanguages[language] = addToGlobal;
                    console.log("Successfully pushed new " + language + " data to MongoDB.");
                }
                res.render('addpage', {
                    language: "Thanks for your contribution!"
                });
            });
        } else {
            res.render('addpage', {
                language: "Language already exists! :("
            });
        }
    });
});

app.get("/addpage", function(req, res) {
    res.render('addpage');
});

app.get("/trainpage", function(req, res) {
    res.render('train');
});

app.get("/detection", function(req, res) {
    res.render('first');
});

app.get("/update", function(req, res) {
    Language.find({}, function(err, languages) {
        if (err) throw err;
        else {
            for (let i = 0; i < languages.length; i++) {
                globalLanguages[languages[i].language] = languages[i];
            }

            res.redirect('/');
        }
    });
});

app.get('/filter/:filter', function(req, res) {
    var filter = req.params.filter;
    var gCopy = h.limitProfiles(globalLanguages);
    var final = {};
    if (filter == "asian") {
        _.mapObject(gCopy, function(item) {
            if (item.category == "Japonic" || item.category == "Sino-Tibetan") {
                final[item.language] = item;
                return true;
            } else return false;
        });
    } else if (filter == "romance") {
        _.mapObject(gCopy, function(item) {
            if (item.category == "Romance") {
                final[item.language] = item;
                return true;
            } else return false;
        });
    } else if (filter == "european") {
        _.mapObject(gCopy, function(item) {
            if (item.category == "Indo-European") {
                final[item.language] = item;
                return true;
            } else return false;
        });
    } else if (filter == "germanic") {
        _.mapObject(gCopy, function(item) {
            if (item.category == "Germanic") {
                final[item.language] = item;
                return true;
            } else return false;
        });
    } else if (filter == "other") {
        _.mapObject(gCopy, function(item) {
            if (item.category != "Indo-European" && item.category != "Germanic" && item.category != "Japonic" &&
                item.category != "Sino-Tibetan") {
                final[item.language] = item;
                return true;
            } else return false;
        });
    } else {}
    if (!_.isEmpty(gCopy)) {
        res.render('homepage', {
            data: final,
            text: ""
        });
    } else {
        res.render('homepage', {
            data: final,
            text: "**Update data first!**"
        });
    }
});

app.get('/', function(req, res) {
    gCopy = h.limitProfiles(globalLanguages);

    console.log(_.isEmpty(gCopy));
    if (!_.isEmpty(gCopy)) {
        res.render('homepage', {
            data: gCopy,
            text: ""
        });
    } else {
        res.render('homepage', {
            data: gCopy,
            text: "**Update data first!**"
        });
    }
})

app.listen(3000, function() {
    console.log(process.env.MONGODB)
    mongoose.connect(process.env.MONGODB, function(err) {
        mongoose.connection.on('error', function() {
            console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
            process.exit(1);
        });
        // h.initialLoad();
    });

});
