var fs = require("fs");
var path = require("path");

var file = path.resolve(process.argv[2]);
var status = process.argv[3];

var featureCollection = JSON.parse(fs.readFileSync(file, "utf8"));
features = featureCollection.features.filter(function(feature) {
    return feature.properties.status === status;
});

featureCollection.features = features;

console.log(JSON.stringify(featureCollection, null, 2));

