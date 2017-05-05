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

app.get('/api/data', function(req, res) {
    res.json(h.globalLanguages);
});

app.post('/api/language', function(req, res) {
    var sample = req.body.sample;
    h.langAPI(res, sample);
});

app.post('/language', function(req, res) {
    var sample = req.body.sample;
    h.lang(res, sample);
});

app.post("/api/add", function(req, res) {
    var data = req.body.sample + " ";
    var language = req.body.name;
    var category = req.body.family;
    var origin = req.body.origin;
    var contributor = req.body.contributor;

    h.addAPI(res, data, language, category, origin, contributor);
});

app.post("/api/train", function(req, res) {
    var data = req.body.sample + " ";
    var language = req.body.name;
    var category = req.body.family;

    h.trainAPI(res, data, language, category);
});

app.post("/train", function(req, res) {
    var data = req.body.sample + " ";
    var language = req.body.name;
    var category = req.body.family;

    h.train(res, data, language, category);
});

app.post("/add", function(req, res) {
    var data = req.body.sample + " ";
    var language = req.body.name;
    var category = req.body.family;
    var origin = req.body.origin;
    var contributor = req.body.contributor;

    h.addLang(res, data, language, category, origin, contributor);
});

app.get('/filter/:filter', function(req, res) {
    var filter = req.params.filter;
    var gCopy = h.limitProfiles(h.globalLanguages);
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
                h.globalLanguages[languages[i].language] = languages[i];
            }

            res.redirect('/');
        }
    });
});

app.get('/', function(req, res) {
    gCopy = h.limitProfiles(h.globalLanguages);

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
        h.initialLoad();
    });

});
