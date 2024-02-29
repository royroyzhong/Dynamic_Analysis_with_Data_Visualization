/**
 * dispatcher
 */
const dispatcher = d3.dispatch(
  "forceDirectedGraph",
  "forceDirectedGraph-reset",
  "forceDirectedGraph-to-methods",
  "forceDirectedGraph-to-class",
  "callGraph"
);
/**
 * Load data
 */

let gobalData,
  forceDirectedGraphData,
  cpData,
  originCPData,
  circularGraph,
  forceDirectedGraph,
  ForceDirectedFunctionGraph;

Promise.all([
  d3.json("data/executionGraph.json"),
  d3.json("data/graph.json"),
  d3.json("data/classGraph.json"),
])
  .then((dataset) => {
    gobalData = dataset[0];
    forceDirectedGraphData = dataset[2];
    cpData = dataset[1];
    originCPData = dataset[1];

    forceDirectedGraph = new ForceDirectedGraph(
      { parentElement: "#force-directed-graph" },
      forceDirectedGraphData,
      dispatcher
    );
    forceDirectedGraph.updateVis();

    // circular view
    circularGraph = new CircularGraphPack(
      { parentElement: "#circular-graph" },
      cpData
    );
    circularGraph.updateVis(false);

    // ForceDirectedFunctionGraph = new Network_function(
    //   { parentElement: "#network-graph" },
    //   gobalData,
    //   dispatcher
    // );
    // ForceDirectedFunctionGraph.updateVis();

    // CallGraph(gobalData)
  })
  .catch((error) => console.error(error));

dispatcher.on("forceDirectedGraph", (data) => {
  let module = data.split("=>")[1];
  let newData;
  originCPData.children[0].children.forEach((d) => {
    if (d.name == module) {
      newData = d;
    }
  });
  // let tempClass;
  // newData.children.forEach((d) => {
  //   if (d.name == data.split("=>")[0]) {
  //     tempClass = d;
  //   }
  // });
  let tempData = { name: "world", children: [] };
  tempData.children.push(newData);
  cpData = tempData;

  let getData = circularGraph.getData;
  circularGraph.reset(getData.vis, getData.root, getData.nodes, getData.label);
  circularGraph.updateVis(true, cpData);
});

dispatcher.on("forceDirectedGraph-reset", (data) => {
  // circularGraph.updateVis(true, originCPData);
  let getData = circularGraph.getData;
  circularGraph.reset(getData.vis, getData.root, getData.nodes, getData.label);
  circularGraph.updateVis(true, originCPData);
});

// dispatcher.on("forceDirectedGraph-to-methods", (data) => {
//   let array = [];
//   if (data.methods != null) {
//     data.methods.forEach((d) => {
//       array.push(d.name);
//     });
//   }
//   ForceDirectedFunctionGraph.updateVis(true, array);
// });

// dispatcher.on("forceDirectedGraph-to-class", (data) => {
//   // forceDirectedGraph.updateVis(true, array);
// });

// dispatcher.on("callGraph", (data) => {
//   console.log(data);
//   CallGraph(data)
//   }
// )
