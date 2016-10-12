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
    case "conversations": type = "conversations"; break;
    case "tags": type = "tags"; break;
    default: console.error("No type, or incorrect type specified. Got \"%s\"", process.argv[3]); process.exit(1);
}

const changedFeatures = featureCollection.features.map(feature => {
    if (type === "walks") {
        feature.properties.tags = ["walk"];
    } else if (type === "roadworks") {
        feature.properties.tags = ["roadworks", "disruption", feature.properties.asset_type.toLowerCase()];
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
    } else if (type === "tags") {
        feature.properties.tags.forEach(tag => {
            feature.properties[tag] = true;
        });
    } else if (type === "conversations") {
        delete feature.properties.comments;

        const person = () => {
            return {
                name: `${Faker.name.firstName()} ${Faker.name.lastName()}`,
                avatar_uri: Faker.internet.avatar(),
            };
        };

        const time = () => randomBetween(1444603649, 1476226049);
        const conversations = range(randomBetween(0, 3)).map(conversation => {
            return {
                title: Faker.lorem.sentence(1),
                submitter: person(),
                time: time(),
                link: Faker.internet.url(),
                comments: range(randomBetween(0, 6)).map(comment => {
                    return {
                        commenter: person(),
                        time: time(),
                        text: Faker.lorem.paragraphs(randomBetween(1, 5)),
                    }

                })
            };
        });

        feature.properties.conversations = conversations;
    }
    return feature;
});

featureCollection.features = changedFeatures;

console.log(JSON.stringify(featureCollection, null, 2));

function randomBetween(x: number, y: number): number {
    return Math.floor(Math.random() * (y - x) + x);
}