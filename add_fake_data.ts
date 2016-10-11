import * as Faker from "faker";
import { range } from "d3-array";
import * as process from "process";
import * as path from "path";
import * as fs from "fs";

const filePath = path.resolve(process.argv[2]);
const file = fs.readFileSync(filePath, "utf8");
const featureCollection: GeoJSON.FeatureCollection<any> = JSON.parse(file);

let type: null | string = null;
switch (process.argv[3]) {
    case "walks": type = "walks"; break;
    case "roadworks": type = "roadworks"; break;
    case "buildings": type = "buildings"; break;
    default: console.error("No type, or incorrect type specified. Got \"%s\"", process.argv[3]); process.exit(1);
}

const changedFeatures = featureCollection.features.map(feature => {
    const comments = range(randomBetween(0, 6)).map(comment => {
        const name = Faker.name;
        return {
            name: `${name.firstName()} ${name.lastName()}`,
            text: Faker.lorem.paragraphs(randomBetween(1, 5)),
        }
    });
    feature.properties.comments = comments;

    if (type === "walks") {
        feature.properties.tags = ["walk"];
    } else if (type === "roadworks") {
        feature.properties.tags = ["roadworks", "disruption", feature.properties.asset_type.toLowerCase() ];
    } else if (type === "buildings") {
        const status: string = feature.properties.status;
        feature.properties.tags = ["developments"];
        if (status === "UNDER CONSTRUCTION") {
            feature.properties.tags.push("disruption");
        }
        feature.properties.tags.push(status.toLowerCase());

        const floorsRaw: null | string = feature.properties.floors_abo;
        let floor: null | string = null;
        if (floorsRaw) {
            const floorsRawNumber = +floorsRaw;
            if (floorsRawNumber >= 30) {
                floor = "30+ floors";
            } else if (floorsRawNumber >= 10 && floorsRawNumber < 30) {
                floor = "10-29 floors";
            } else {
                floor = "1-10 floors";
            }
        }
        feature.properties.tags.push(floor);
    }
    return feature;
});

featureCollection.features = changedFeatures;

console.log(JSON.stringify(featureCollection, null, 2));

function randomBetween(x: number, y: number): number {
    return Math.floor(Math.random() * (y - x) + x);
}