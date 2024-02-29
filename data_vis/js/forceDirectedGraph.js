class ForceDirectedGraph {
  /**
   * Class constructor with basic chart configuration
   * modified code from CPSC 436V tutorials
   *
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 800,
      containerHeight: _config.containerHeight || 800,
      tooltipPadding: 10,
      margin: { top: -100, right: 200, bottom: 0, left: 0 },
    };
    this.data = _data;
    this.dispatcher = _dispatcher;
    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.config.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.config.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Initialize scales
    vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    // vis.chart = vis.svg
    //   .append("g")
    //   .attr(
    //     "transform",
    //     `translate(${vis.config.margin.left},${vis.config.margin.top})`
    //   );

    vis.chartArea = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.chart = vis.chartArea.append("g");
    vis.chart
      .append("defs")
      .append("marker")
      .attr("id", "arrow-head")
      .attr("markerUnits", "strokeWidth")
      .attr("refX", "6")
      .attr("refY", "2")
      .attr("markerWidth", "20")
      .attr("markerHeight", "10")
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L2,2 L 0,4")
      .attr("stroke", "black")
      .attr("fill", "none")
      .attr("z-index", 1);

    // Initialize force simulation
    vis.simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.name)
          .distance(100)
      )
      .force("charge", d3.forceManyBody())
      .force(
        "center",
        d3.forceCenter(vis.config.width / 2, vis.config.height / 2)
      );

    vis.chart = vis.chartArea.append("g").attr("clip-path", "url(#chart-mask)");
    vis.legend = vis.chart;
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis(type, array) {
    let vis = this;
    if (type == true) {
    }

    vis.simulation.nodes(vis.data.nodes);
    vis.simulation.force("link").links(vis.data.links);

    vis.colorScale.domain(vis.data.nodes.map((d) => d.name.split("=>")[1]));

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;

    // Add links
    const links = vis.chart
      .append("g")
      .selectAll("line")
      .data(vis.data.links, (d) => [d.source, d.target])
      .join("line")
      .attr("stroke-width", (d) => {
        return 0.5;
      })
      .attr("stroke", "black")
      .attr("class", "network-link")
      .attr("marker-end", (d) => {
        return "url(#arrow-head)";
      });

    // Add nodes
    const nodes = vis.chart
      .append("g")
      .selectAll("circle")
      .data(vis.data.nodes, (d) => d.name.split("=>")[1])
      .join("circle")
      .attr("r", (d) => d.value * 20 + 5)
      .attr("fill", (d) => vis.colorScale(d.name.split("=>")[1]))
      .attr("class", "node");

    const legend = vis.legend
      .selectAll(".legend-class")
      .data(vis.colorScale.domain())
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(50,${i * 20 + 800})`);

    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", vis.colorScale);

    legend
      .append("text")
      .attr("x", 10)
      .attr("y", 5)
      .attr("z-index", 2)
      .text((d) => {
        return d;
      });

    // const classNodeLabel = vis.legend
    //   .append("g")
    //   .attr("transform", `translate(350,800)`);
    // classNodeLabel
    //   .append("circle")
    //   .attr("cx", 0)
    //   .attr("cy", 0)
    //   .attr("r", 7)
    //   .attr("fill", "blue");
    // classNodeLabel
    //   .append("text")
    //   .attr("x", 10)
    //   .attr("y", 5)
    //   .attr("z-index", 2)
    //   .text((d) => {
    //     return "Class Node";
    //   });
    // const MethodNodeLabel = vis.legend
    //   .append("g")
    //   .attr("transform", `translate(343,820)`);
    // MethodNodeLabel.append("rect")
    //   .attr("x", 0)
    //   .attr("y", 0)
    //   .attr("width", 15)
    //   .attr("height", 15)
    //   .attr("fill", "blue");
    // MethodNodeLabel.append("text")
    //   .attr("x", 20)
    //   .attr("y", 12)
    //   .attr("z-index", 2)
    //   .text((d) => {
    //     return "Method Node";
    //   });
    // Update positions
    vis.simulation.on("tick", () => {
      links
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodes
        .attr("cx", (d) => {
          return d.x;
        })
        .attr("cy", (d) => d.y);
    });

    nodes
      .on("click", function (event, d) {
        const isActive = d3.select(this).classed("active");
        d3.select(this).classed("active", !isActive);
        // vis.onClickLinkUpdateHelper(vis, d);
        onClickLinkUpdateHelper(vis, d, ".network-link", 4, 0, ".node", 1, 0.2);
        vis.tooltipHelper(event, vis, true, d);

        //dispatcher
        if (!(d.name.includes("Global") || d.name.includes("global"))) {
          vis.dispatcher.call("forceDirectedGraph", event, d.name);
          // vis.dispatcher.call("forceDirectedGraph-to-methods", event, d);
        }
      })
      .on("mousemove", (event, d) => {
        // vis.onClickLinkUpdateHelper(vis, d);
        onClickLinkUpdateHelper(vis, d, ".network-link", 4, 0, ".node", 1, 0.2);
        vis.tooltipHelper(event, vis, false, d);
      });

    vis.svg.on("click", function (event, d) {
      if (event.target.firstChild != null) {
        d3.selectAll(".node").attr("opacity", 1);
        d3.selectAll(".network-link").attr("stroke-width", 0);
        vis.dispatcher.call("forceDirectedGraph-reset");
      }
    });
  }

  tooltipHelper(event, vis, type, d) {
    d3.select(".tooltip").style("opacity", 1);
    let methods = "";
    d.methods.forEach((d) => {
      methods = methods.concat(
        "<li class='indent-list'>  Name: " +
          d.name +
          ";  Values: " +
          d.value.toFixed(2) +
          "</li>"
      );
    });

    if (type == true) {
      d3.select("#tooltip-left-hr").style("opacity", 1);
      d3
        .select("#tooltip-left")
        .style("display", "block")
        .style("left", event.pageX + vis.config.tooltipPadding + "px")
        .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
  <div class="tooltip-title-left">${"Class Information"}</div>
  <ui>
  <li>Class Name: ${d.name.split("=>")[0]}</li>
  <li>Module Name: ${d.name.split("=>")[1]}</li>
  <li> <ui>Methods: ${methods} </ui> </li>
  </ui>
  
  
  `);
    } else {
      d3
        .select("#tooltip-right")
        .style("display", "block")
        .style("left", event.pageX + vis.config.tooltipPadding + "px")
        .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
        <div class="tooltip-title-right">${"Class Information"}</div>
        <ui>
        <li>Class Name: ${d.name.split("=>")[0]}</li>
        <li>Module Name: ${d.name.split("=>")[1]}</li>
        <li> <ui>Methods: ${methods}</ui> </li>
        </ui>
  `);
    }
  }

  onClickLinkUpdateHelper(vis, node) {
    node.isClick = 1;
    let listOfClass = new Set();
    listOfClass.add(node.name);
    vis.data.links.forEach((d) => {
      if (node.name == d.source.name || node.name == d.target.name) {
        d.click = 1;
        listOfClass.add(d.source.name);
        listOfClass.add(d.target.name);
      } else {
        d.click = 0;
      }
    });

    d3.selectAll(".network-link")
      .attr("stroke-width", (d) => {
        return d.click == 1 ? 4 : 0;
      })
      .attr("opacity", "1");

    vis.data.nodes.forEach((d) => {
      d.isClick = 0;
      if (listOfClass.has(d.name)) {
        d.isClick = 1;
      } else {
        d.isClick = 0;
      }
    });

    d3.selectAll(".node").attr("opacity", (d) => {
      if (d.isClick == 1) {
        return 1;
      } else {
        return 0.2;
      }
    });
  }
}
