const fs = require("fs");
let nodes = "{\"nodes\": ["; 
fs.readdirSync("./output").forEach((file) => {
    if(file.endsWith(".json")) {
        let rawData = fs.readFileSync("./output/" + file);
        let data = JSON.parse(rawData);
        for(var key in data) {
            if(key != "global_funcs" && key != "imports"){
                let temp = "{\"name\":\"" + key +"\", \"methods\": [";
                for(var func in data[key]) {
                    temp = temp + "\"" + func + "\"" + ",";
                }
                if(temp.endsWith(",")) {
                    temp = temp.slice(0,-1) + "]},";
                } else {
                    temp = temp + "]},";
                }
                nodes = nodes + temp;
            }
        }
    }
});
fs.writeFileSync("./d3withmock/data/nodes.json", nodes.slice(0, -1) + ']}');
let s = fs.readFileSync("./output/log.txt") + '';
let calls = s.split(/\r?\n/);
var out = "";
for (let i = 0;i < calls.length; i++) {
    if(calls[i].startsWith("class method")) {
        let temp = calls[i].split(":");
        temp = temp[1].split("->");
        let caller = temp[0].trim();
        let callee = temp[1].split(".")[1];
        out += "{\"source\": \"" + caller + "\", \"target\": \"" + callee + "\", \"value\": 1},";
    }
}
let link = "{\"links\":[" + out.slice(0,-1) + "]}";
let test = JSON.parse(link);
//test.links.remove(1);
//fs.writeFileSync("./d3withmock/data/links.json", JSON.stringify(test));
let i = 0;
while (i < test.links.length) {
    let j = i + 1;
    if (test.links[i]) {
        let count = 1;
        while (j < test.links.length) {
            if (test.links[j]) {
                if (JSON.stringify(test.links[i]) == JSON.stringify(test.links[j])){
                    delete test.links[j];
                    count++;
                }
            }
            j++;
        }
        test.links[i].value = count;
    }
    i++;
}
let result = "{\"links\":[";
for(let i = 0; i<test.links.length;i++) {
    if(test.links[i] != null) {
        result += JSON.stringify(test.links[i]) + ",";
    }
}
fs.writeFileSync("./d3withmock/data/links.json", result.slice(0,-1) + "]}");