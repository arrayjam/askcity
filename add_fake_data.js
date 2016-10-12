"use strict";
var Faker = require("faker");
var d3_array_1 = require("d3-array");
var process = require("process");
var path = require("path");
var fs = require("fs");
var filePath = path.resolve(process.argv[2]);
var file = fs.readFileSync(filePath, "utf8");
var featureCollection = JSON.parse(file);
var type = null;
switch (process.argv[3]) {
    case "walks":
        type = "walks";
        break;
    case "roadworks":
        type = "roadworks";
        break;
    case "buildings":
        type = "buildings";
        break;
    case "conversations":
        type = "conversations";
        break;
    default:
        console.error("No type, or incorrect type specified. Got \"%s\"", process.argv[3]);
        process.exit(1);
}
var changedFeatures = featureCollection.features.map(function (feature) {
    if (type === "walks") {
        feature.properties.tags = ["walk"];
    }
    else if (type === "roadworks") {
        feature.properties.tags = ["roadworks", "disruption", feature.properties.asset_type.toLowerCase()];
    }
    else if (type === "buildings") {
        var status_1 = feature.properties.status;
        feature.properties.tags = ["developments"];
        if (status_1 === "UNDER CONSTRUCTION") {
            feature.properties.tags.push("disruption");
        }
        feature.properties.tags.push(status_1.toLowerCase());
        var floorsRaw = feature.properties.floors_abo;
        var floor = null;
        if (floorsRaw) {
            var floorsRawNumber = +floorsRaw;
            if (floorsRawNumber >= 30) {
                floor = "30+ floors";
            }
            else if (floorsRawNumber >= 10 && floorsRawNumber < 30) {
                floor = "10-29 floors";
            }
            else {
                floor = "1-10 floors";
            }
        }
        feature.properties.tags.push(floor);
    }
    else if (type === "conversations") {
        delete feature.properties.comments;
        var person_1 = function () {
            return {
                name: Faker.name.firstName() + " " + Faker.name.lastName(),
                avatar_uri: Faker.internet.avatar()
            };
        };
        var time_1 = function () { return randomBetween(1444603649, 1476226049); };
        var conversations = d3_array_1.range(randomBetween(0, 3)).map(function (conversation) {
            return {
                title: Faker.lorem.sentence(1),
                submitter: person_1(),
                time: time_1(),
                link: Faker.internet.url(),
                comments: d3_array_1.range(randomBetween(0, 6)).map(function (comment) {
                    return {
                        commenter: person_1(),
                        time: time_1(),
                        text: Faker.lorem.paragraphs(randomBetween(1, 5))
                    };
                })
            };
        });
        feature.properties.conversations = conversations;
    }
    return feature;
});
featureCollection.features = changedFeatures;
console.log(JSON.stringify(featureCollection, null, 2));
function randomBetween(x, y) {
    return Math.floor(Math.random() * (y - x) + x);
}
