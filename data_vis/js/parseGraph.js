const fs = require("fs");
let graph = fs.readFileSync("./output/graph.json");
let links = fs.readFileSync("./output/testcase_execution.json");
graph = JSON.parse(graph);
links = JSON.parse(links);
let nodes = graph.nodes;
let map = new Map();
for (let i = 0; i < nodes.length; i++) {
    let obj = nodes[i].id.split("::");
    let className, funcName;
    if (obj[1].includes(".")) {
        className = obj[1].split(".")[0];
        funcName = obj[1].split(".")[1];
    } else {
        className = "GlobalFunction";
        funcName = obj[1];
    }
    if(map.has(obj[0])) {
        let l = map.get(obj[0]);
        if(l.has(className)) {
            let funcs = l.get(className);
            funcs.push(funcName);
            l.set(className,funcs);
        } else {
            l.set(className, [funcName]);
        }
        map.set(obj[0], l);
    } else {
        let temp = new Map();
        temp.set(className,[funcName]);
        map.set(obj[0], temp);
    }
}
nodes = "{\"name\": \"python\",\"children\":["
map.forEach((value, key) => {
    nodes += "{\"name\":\"" + key + "\",\"children\": [";
    value.forEach((v,k) => {
        nodes += "{\"name\":\"" + k + "\",\"value\": 0,\"children\":["
        for(let i = 0; i < v.length;i++) {
            nodes += "{\"name\":\"" + v[i] + "\", \"value\": 0},"
        }
        nodes = nodes.slice(0,-1);
        nodes += "]},";
    })
    nodes = nodes.slice(0,-1);
    nodes += "]},";
})
nodes = nodes.slice(0,-1)
nodes+="]}";
nodes = JSON.parse(nodes);
links = links.links;
links = fs.readFileSync("./output/testcase_execution.json");
links = JSON.parse(links);
for(let i = 0; i < links.nodes.length; i++) {
    let id = links.nodes[i].id.split("::");
    let cen = links.nodes[i].centrality;
    let moduleName = id[0];
    let className,methodName;
    if(id.length != 1) {
        if (id[1].split(".").length == 1) {
            className = "GlobalFunction";
            methodName = id[1];
        } else {
            className = id[1].split(".")[0];
            methodName = id[1].split(".")[1];
        }
        for (let j = 0; j < nodes.children.length; j++) {
            if(moduleName == nodes.children[j].name) {
                for (let k = 0; k < nodes.children[j].children.length; k++) {
                    let count = nodes.children[j].children[k].value;
                    if (className == nodes.children[j].children[k].name) {
                        for (let l = 0; l < nodes.children[j].children[k].children.length; l++) {
                            if(methodName == nodes.children[j].children[k].children[l].name) {
                                nodes.children[j].children[k].children[l].value = cen;
                                count += cen;
                            }
                        }
                    }
                    nodes.children[j].children[k].value = count;
                }
            }
        }
    }
}
nodes = JSON.stringify(nodes);
nodes = "{\"name\": \"world\",\"children\": [" + nodes + "]}"
fs.writeFileSync("./d3withmock/data/graph.json",nodes); 