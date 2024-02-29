class CircularGraph {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 600,
      containerHeight: 600,
      margin: { top: 20, right: 20, bottom: 20, left: 15 },
    };
    this.data = _data;
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
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Color palette for continents?
    vis.color = d3
      .scaleOrdinal()
      .domain(["Asia", "Europe", "Africa", "Oceania", "Americas"])
      .range(d3.schemeSet1);

    // Size scale for countries
    vis.scale = d3.scaleLinear().range([7, 55]); // circle will be between 7 and 55 px wide

    // Initialize force simulation

    vis.simulation = d3
      .forceSimulation()
      .force(
        "center",
        d3
          .forceCenter()
          .x(vis.config.width / 2)
          .y(vis.config.height / 2)
      ) // Attraction to the center of the svg area
      .force("charge", d3.forceManyBody().strength(0.1)); // Nodes are attracted one each other of value is > 0

    vis.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    // Add node-link data to simulation
    // vis.simulation.nodes(vis.data.nodes);
    // vis.simulation.force("link").links(vis.data.links);

    // vis.colorScale.domain(
    //   vis.data.nodes.map((d) => {
    //     return d.group;
    //   })
    // );
    vis.scale.domain([0, 1400000000]); // circle will be between 7 and 55 px wide
    vis.simulation.nodes(vis.data).force(
      "collide",
      d3
        .forceCollide()
        .strength(0.2)
        .radius(function (d) {
          return vis.scale(d.value) + 3;
        })
        .iterations(1)
    ); // Force that avoids circle overlapping;

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;

    // Add nodes
    // const nodes = vis.chart
    //   .selectAll("circle")
    //   .data(vis.data.nodes, (d) => d.id)
    //   .join("circle")
    //   .attr("r", 5)
    //   .attr("fill", (d) => vis.colorScale(d.id));
    const node = vis.chart
      .selectAll("circle")
      .data(vis.data)
      .join("circle")
      .attr("class", "node")
      .attr("r", (d) => {
        return vis.scale(d.value);
      })
      .attr("cx", vis.config.containerWidth / 2)
      .attr("cy", vis.config.containerHeight / 2)
      .style("fill", (d) => {
        return vis.color(d.region);
      })
      .style("fill-opacity", 0.8)
      .attr("stroke", "black")
      .style("stroke-width", 1);

    node.exit().remove();
    vis.simulation.on("tick", (d) => {
      return node
        .attr("cx", (d) => {
          return d.x;
        })
        .attr("cy", (d) => {
          return d.y;
        });
    });
  }
}
