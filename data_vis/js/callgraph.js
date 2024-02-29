/**
 * Call graph visualization
 */

let nodesOld = []
let linksOld = []

/**
 * Data clean-up and initialization
 * @param {*} data call graph
 */
function cgPrologue(data) {
   
    let nodes = []
    data.nodes.forEach((node) => {
        node.methods.forEach((method) => {
            nodes.push({
                "id": node.name + "." + method.name,
                "weight": method.weightvalue,
            })
        })
    })

    let links = []
    data.links.forEach((link) => {
        let linkObj = {
            "source": link.source + "." + link.sourceMethod,
            "target": link.target + "." + link.targetMethod,
            "weight": link.weight,
            "time":   link.time,
        }
        // Exclude non-exist links   
        if ((nodes.find(node => node.id === linkObj.source) !== undefined)
            && (nodes.find(node => node.id === linkObj.target) !== undefined)) {
                links.push(linkObj)
        }
    })

    // Exclude nodes with no links
    nodes = nodes.filter((node) => {
        return links.find(link => link.source === node.id || link.target === node.id) !== undefined
    })

    nodesOld = data.node
    data.nodes = nodes
    linksOld = data.node
    data.links = links
}

// =================================================================================================
// Helper 
// =================================================================================================
function connectedNodes(nodes, d) {
    return nodes.filter((node) => {
        return node.id === d.source.id || node.id === d.target.id
    })
}

function outEdge(links, d) {
    return links.filter((link) => {
        return link.source.id === d.id
    })
}

function inEdge(links, d) {
    return links.filter((link) => {
        return link.target.id === d.id
    })
}

function transition(path) {
    path.transition()
        .duration(1000)
        .attrTween("stroke-dasharray", tweenDash)
        .on("end", function() { d3.select(this).call(transition); });
}

function tweenDash() {
  var l = this.getTotalLength(),
      i = d3.interpolateString("0," + l, l + "," + l);
  return function(t) { return i(t); };
}

// =================================================================================================
// Animation
// =================================================================================================



// =================================================================================================
// Main
// =================================================================================================

function CallGraph(data) {

    cgPrologue(data);

    // Setup main canvas 
    let canvas = d3.select("#call-graph")
        .append("svg")  
        .attr("width", 1000)
        .attr("height", 1000)
        .attr("id", "call-graph-svg")
            .append("g")
            .attr("transform", "translate(0,0)");

    // Arrow Head
    canvas.append('defs').append('marker')
        .attr("id",'arrowhead')
        .attr('viewBox','0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
        .attr('refX',11) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
        .attr('refY',6)
        .attr('orient','auto')
            .attr('markerWidth',12)
            .attr('markerHeight',12)
            .attr('xoverflow','visible')
        .append('svg:path')
        .attr("d", "M 0,0 V 4 L6,2 Z")
        .attr('fill', '#555')
        .style('stroke','none');

    // Setup all links 
    let cgLinks = canvas 
        .append("g")
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0)
            .attr("class", "function-link")
            .attr('marker-end', function(d,i){ return 'url(#arrowhead)' })
            .on("click", function (event, d) {
                console.log(connectedNodes(data.nodes, d))


            })
    // Setup an arc 
    let arc = d3.arc()
            .innerRadius(50)
            .outerRadius(70)
            .startAngle(45 * (Math.PI/180))
            .endAngle(3)

    // Setup a path alone with links
    let cgPath = canvas
        .selectAll(".function-path")
        .data(data.links)
        .enter()
        .append("path")
            .attr("class", "function-path")
            .attr("id", (d) => { return d.source + "-" + d.target })
            .attr("d", arc)
            .style("stroke-dasharray", "4,4")
            .style("stroke", "#555888")
            .style("pointer-events", "none")
            .style("fill", "none")
            // .call(transition)

    // Setup all nodes
    let cgNodes = canvas 
        .selectAll(".function-node")
        .data(data.nodes)
        .enter()
        .append("g")
        .attr("class", "function-node")
        
        // ON MOUSE-IN Animation
        .on("mouseover", function (event, d) {
            out = outEdge(data.links, d)
            d3.selectAll(".function-path")
                .filter((link) => out.includes(link))
                .transition(300)
                .attr("stroke", "#7788aa")
                .attr("stroke-opacity", 1)
                .attr("stroke-width", 3)
        })
        // ON MOUSE-OUT Animation
        .on("mouseout", function (event, d) {
            out = outEdge(data.links, d)
            d3.selectAll(".function-path")
                .filter((link) => out.includes(link))
                .transition(300)
                .attr("stroke", "#555777")
                .attr("stroke-width", 1)
        })
        // MAIN WALK 
        .on("click", function (event, d) {
            let queue = []
            let visited = []
            let timestamp = 0
            let f = 0
            queue.push(d)
            while (queue.length > 0) {
                let node = queue.shift()
                if (visited.includes(node)) {
                    continue
                }
                visited.push(node)
                let out = outEdge(data.links, node)
                    .filter((link) => link.time > timestamp)
                    .sort((a, b) => a.time - b.time)
                out.forEach((link) => {
                    timestamp = link.time
                    queue.push(link.target)
                })

                console.log(
                    "Node is is " + node.id + " at time " + timestamp
                )
                
                d3.selectAll(".function-node-c")
                    .filter((n) => n.id === node.id)
                    .transition(2000)
                    .delay(f * 1000)
                    .style("fill", "#8877aa")
                ++f
            }
        })
        
    /**
     * Render elements belone to each node, including:
     * 1. Node circle
     * 2. Node text
     */
    let nodeRender = () => {
        cgNodes
            .append("circle")
                .attr("r", 20) 
                .attr("id", (d) => { return d.id + '-c'})
                .style("fill", "#69b3a2")
                .attr("class", "function-node-c")

        cgNodes
            .append("text")
                .text((d) => d.id.split("=>")[0] + "." + d.id.split(".")[2])
                .attr("dx", 12)
                .attr("dy", ".85em")
                .attr("text-anchor", "middle")
                .attr("font-size", 18)
                .attr("font-family", "ubuntu")
        }
    nodeRender()

    let nodeCircle  = cgNodes.selectAll("circle")
    let nodeText    = cgNodes.selectAll("text")

    /**
     * Geometric positioning of all SVG elements
     */
    let ticked = function() {
        cgLinks
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .attr("stroke-width", function(d) {return 2})
        nodeCircle    
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
        nodeText
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })

        // cgPath.attr("d", function(d) {
        //     return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
        // })

        cgPath.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" + 
                    d.source.x + "," + 
                    d.source.y + "A" + 
                    dr + "," + dr + " 0 0,1 " + 
                    d.target.x + "," + 
                    d.target.y;
            });
    } 

    /*
     * Force simulation
     */
    d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink().id(function(d) {return d.id}).distance(70).links(data.links))
        .force("charge", d3.forceManyBody().strength(-240)) 
        .force("center", d3.forceCenter(500, 500))
        .force('collide', d3.forceCollide(d => 95))
        .on("end", ticked);
}