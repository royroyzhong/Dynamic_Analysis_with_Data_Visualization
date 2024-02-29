class Network_function {
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
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 500,
      tooltipPadding: 10,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
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
      .attr("id", "arrow-head-method")
      .attr("markerUnits", "strokeWidth")
      .attr("refX", "4")
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
          .id((d) => d.id)
          .distance(10)
      )
      .force("charge", d3.forceManyBody())
      .force(
        "center",
        d3.forceCenter(vis.config.width / 2, vis.config.height / 2)
      );

    vis.chart = vis.chartArea
      .append("g")
      .attr("clip-path", "url(#chart-mask-methods)");
    // vis.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis(type, array) {
    let vis = this;
    if (type == true) {
      vis.data.nodes.forEach((d) => {
        if (array.includes(d.name)) {
          d.fromClass = 1;
        } else {
          d.fromClass = 0;
        }
      });
      vis.data.links.forEach((d) => {
        if (array.includes(d.source.name) || array.includes(d.target.name)) {
          d.fromClass = 1;
        } else {
          d.fromClass = 0;
        }
      });
    }

    vis.simulation.nodes(vis.data.nodes);
    vis.simulation.force("link").links(vis.data.links);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;

    // Add links
    const links = vis.chart
      .selectAll("line")
      .data(vis.data.links, (d) => [d.source, d.target])
      .join("line")
      .attr("stroke-width", (d) => {
        if (d.fromClass) {
          return 3;
        } else {
          return 3;
        }
      })
      .attr("stroke", "black")
      .attr("class", "function-link")
      .attr("marker-end", (d) => {
        return "url(#arrow-head-method)";
      })
      .attr("opacity", (d) => {
        if (d.fromClass) {
          return 1;
        } else {
          return 1;
        }
      });

    // Add nodes
    const nodes = vis.chart
      .append("g")
      .selectAll("rect")
      .data(vis.data.nodes, (d) => d.name)
      .join("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", (d) => vis.colorScale(d.name))
      .attr("class", "function-node")
      .attr("opacity", (d) => {
        if (d.fromClass) {
          return 1;
        } else {
          return 1;
        }
      });

    nodes
      .on("click", function (event, d) {
        const isActive = d3.select(this).classed("active");
        d3.select(this).classed("active", !isActive);
        // vis.onClickLinkUpdateHelper(vis, d);
        onClickLinkUpdateHelper(
          vis,
          d,
          ".function-link",
          4,
          0,
          ".function-node",
          1,
          0.2
        );

        vis.tooltipHelper(event, vis, true, d);

        // dispatcher

        vis.dispatcher.call("forceDirectedGraph-to-class", event, d);
      })
      .on("mouseover", (event, d) => {
        onClickLinkUpdateHelper(
          vis,
          d,
          ".function-link",
          4,
          0,
          ".function-node",
          1,
          0.2
        );
        vis.tooltipHelper(event, vis, false, d);
      });

    //add weights title
    links.join("title").text((d) => {
      return d.value;
    });
    const edgepaths = vis.chart
      .selectAll(".edgepath")
      .data(vis.data.links)
      .join("path")
      .attr("class", "path")
      .attr("id", function (d, i) {
        return "edgepath" + i;
      });
    const edgelabels = vis.chart
      .selectAll(".edgelabel")
      .data(vis.data.links)
      .join("text")
      .attr("class", "path-text")
      .attr("id", function (d, i) {
        return "edgepath" + i;
      })
      .attr("font-size", "12")
      .attr("fill", "red");

    edgelabels
      .append("textPath")
      .attr("xlink:href", function (d, i) {
        return "#edgepath" + i;
      })
      .style("text-anchor", "middle")
      .style("pointer-events", "none")
      .attr("startOffset", "50%")
      .text((d) => {
        return d.weight;
      });

    // Update positions
    vis.simulation.on("tick", () => {
      links
        .attr("x1", (d) => d.source.x + 7)
        .attr("y1", (d) => d.source.y + 7)
        .attr("x2", (d) => d.target.x + 7)
        .attr("y2", (d) => d.target.y + 7);

      nodes
        .attr("x", (d) => {
          return d.x;
        })
        .attr("y", (d) => d.y);

      edgepaths.attr(
        "d",
        (d) =>
          "M " +
          d.source.x +
          " " +
          d.source.y +
          " L " +
          d.target.x +
          " " +
          d.target.y
      );
    });
    vis.svg.on("click", function (event, d) {
      if (event.target.firstChild != null) {
        d3.selectAll(".function-node").attr("opacity", 1);
        d3.selectAll(".function-link").attr("stroke-width", 3);
      }
    });
  }

  tooltipHelper(event, vis, type, d) {
    d3.select(".tooltip").style("opacity", 1);
    let methods = "";
    d.methods.forEach((d) => {
      methods = methods.concat(
        "<li class='indent-list'> Methods Name: " +
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
  <div class="tooltip-title-left">${"Method Information"}</div>
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
        <div class="tooltip-title-right">${"Method Information"}</div>
        <ui>
        <li>Class Name: ${d.name.split("=>")[0]}</li>
        <li>Module Name: ${d.name.split("=>")[1]}</li>
        <li> <ui>Methods: ${methods}</ui> </li>
        </ui>
  `);
    }
  }
}
