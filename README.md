
# vincent's little language experiment

---

Name: Vincent Song

Date: May 4, 2017

Project Topic: Language Detection

URL: 

---


### 1. Data Format and Storage

Data point fields:
- `language`:     ...       `Type: String`
- `version`:     ...       `Type: Number`
- `size`:     ...       `Type: Number`
- `original`:     ...       `Type: Boolean`
- `category`:     ...       `Type: String`
- `origin`:     ...       `Type: String`
- `contributor`:     ...       `Type: String`
- `profile`:     ...       `Type: [profileSchema]`

Schema: 
```
profileSchema = {
    ngram: String,
    value: Number
}

languageSchema = {
    language: String,
    version: 0,
    size: Number,
    original: Boolean,
    category: String,
    origin: String,
    contributor: String,
    profile: [profileSchema]
}
```

### 2. Add New Data

HTML form route: `/add`

POST endpoint route: `/api/add`

Example Node.js POST request to endpoint: 
```javascript
var request = require("request");

var options = { 
    method: 'POST',
    url: 'http://localhost:3000/api/add',
    headers: { 
        'content-type': 'application/x-www-form-urlencoded' 
    },
    form: { 
       sample: 世界人权宣言... <700 characters or more>,
       name: "Chinese",
       category: "Sino-Tibetan", 
       origin: "Asia",
       contributor: "Vincent Song
    } 
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
```

### 3. View Data

GET endpoint route: `/api/data`

### 4. Search Data

Search Field: Language

### 5. Navigation Pages

Navigation Filters
1. Home -> `/`
2. Asian -> `/filter/asian`
3. Indo-European -> `/filter/european`
4. Romance -> `/filter/romance`
5. Germanic -> `/filter/germanic`
6. Other -> '/filter/other'

