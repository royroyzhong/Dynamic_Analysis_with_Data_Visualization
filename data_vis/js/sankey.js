class Sankey {
  /**
   * Class constructor with basic chart configuration
   * modified code from
   * https://bl.ocks.org/d3noob/d0212d9bdc0ad3d3e45b40d6d012e455#sankey.js
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1450,
      containerHeight: 2500,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
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

    // Set the sankey diagram properties
    vis.sankey = d3
      .sankey()
      .nodeWidth(36)
      .nodePadding(40)
      .size([vis.config.width, vis.config.height]);

    vis.path = vis.sankey.links();

    vis.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    vis.sankey.nodeId((d) => d.id);

    vis.graph = vis.sankey(vis.data);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;
    console.log(vis.data);

    // add links

    const links = vis.chart
      .append("g")
      .selectAll(".link")
      .data(vis.graph.links)
      .join("path")
      .attr("class", "link")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", function (d) {
        // console.log(d);
        return d.width;
      });

    // Add nodes
    const nodes = vis.chart
      .append("g")
      .selectAll(".node")
      .data(vis.graph.nodes)
      .join("rect")
      .attr("class", "node")
      .attr("x", function (d) {
        return d.x0;
      })
      .attr("y", function (d) {
        return d.y0;
      })
      .attr("height", function (d) {
        return d.y1 - d.y0;
      })
      .attr("width", vis.sankey.nodeWidth())
      .attr("fill", function (d) {
        // console.log(d.name);
        // console.log(d.color);
        // console.log(vis.colorScale(d.id.replace(/ .*/, "")));
        return vis.colorScale(d.id.replace(/ .*/, ""));
      })
      .attr("stroke", function (d) {
        return d3.rgb(vis.colorScale(d.id)).darker(2);
      });

    // .append("title")
    // .text(function (d) {
    //   return d.name + "\n" + format(d.value);
    // });

    // const nodes = vis.chart
    //   .append("g")
    //   .selectAll(".node")
    //   .data(vis.data.nodes)
    //   .join("rect")
    //   .attr("class", "node")
    //   .attr("transform", function (d) {
    //     return "translate(" + d.x + "," + d.y + ")";
    //   })
    //   .call(
    //     d3
    //       .drag()
    //       .subject(function (d) {
    //         return d;
    //       })
    //       .on("start", function () {
    //         this.parentNode.appendChild(this);
    //       })
    //       .on("drag", this.dragmove)
    //   )
    //   .attr("height", function (d) {
    //     return d.dy;
    //   })
    //   .attr("width", sankey.nodeWidth())
    //   .style("fill", function (d) {
    //     return (d.color = color(d.name.replace(/ .*/, "")));
    //   })
    //   .style("stroke", function (d) {
    //     return d3.rgb(d.color).darker(2);
    //   })
    //   .append("title")
    //   .text(function (d) {
    //     return d.name + "\n" + "There is " + d.value + " stuff in this node";
    //   });
  }
  // the function for moving the nodes
  dragmove(d) {
    d3.select(this).attr(
      "transform",
      "translate(" +
        d.x +
        "," +
        (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) +
        ")"
    );
    sankey.relayout();
    link.attr("d", sankey.link());
  }
}
