const fs = require("fs");
let links = fs.readFileSync("./output/testcase_execution.json");
let graph = links;
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
nodes = "{\"nodes\":["
map.forEach((value, key) => {
    value.forEach((v,k) => {
        nodes += "{\"name\":\"" + k + "=>" + key +"\",\"value\": 0,\"methods\":["
        for(let i = 0; i < v.length;i++) {
            nodes += "{\"name\":\"" + v[i] + "\", \"value\": 0},"
        }
        nodes = nodes.slice(0,-1);
        nodes += "]},";
    })
})
nodes = nodes.slice(0,-1);
nodes+="],\"links\":[]}";
nodes = JSON.parse(nodes);
nodes.links = links.links;
links = nodes.links;
let source,target,mName,cName,fName;
for (let i = 0; i < links.length; i++) {
    source = links[i].source.split("::");
    target = links[i].target.split("::");
    if(source.length != 1) {
        mName = source[0];
        if(source[1].split(".").length == 1) {
            cName = "GlobalFunction";
            fName = source[1]; 
        } else {
            cName = source[1].split(".")[0];
            fName = source[1].split(".")[1];
        }
        nodes.links[i].source = cName + "=>" + mName;
        nodes.links[i].sourceMethod = fName;
    } else {
        nodes.links[i].source = "GlobalFunction" + "=>" + source[0];
        nodes.links[i].sourceMethod = "entry_function";
    }
    if(target.length != 1) {
        mName = target[0];
        if(target[1].split(".").length == 1) {
            cName = "GlobalFunction";
            fName = target[1]; 
        } else {
            cName = target[1].split(".")[0];
            fName = target[1].split(".")[1];
        }
        nodes.links[i].target = cName + "=>" + mName;
        nodes.links[i].targetMethod = fName;
    } else {
        nodes.links[i].target = "GlobalFunction" + "=>" + target[0];
        nodes.links[i].targetMethod = "entry_function";
    }
}
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
        moduleName = className + "=>" + moduleName;
        for (let j = 0; j < nodes.nodes.length; j++) {
            if(moduleName == nodes.nodes[j].name) {
                let count = nodes.nodes[j].value;
                for (let k = 0; k < nodes.nodes[j].methods.length; k++) {
                    if(methodName == nodes.nodes[j].methods[k].name) {
                        nodes.nodes[j].methods[k].value = cen;
                        count += cen;
                    }
                }
                nodes.nodes[j].value = count;
            }
        }
    }
}
fs.writeFileSync("./d3withmock/data/executionGraph.json",JSON.stringify(nodes));