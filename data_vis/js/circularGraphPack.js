class CircularGraphPack {
  /**
   * Class constructor with basic chart configuration
   * use the zoom and zoomto code from
   * https://observablehq.com/@d3/zoomable-circle-packing
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 500,
      containerHeight: 500,
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
    // vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    // Color palette for continents?
    vis.color = d3.scaleSequential(d3.interpolatePuBuGn).domain([0, 5]);

    // Size scale for countries
    // vis.scale = d3.scaleLinear().range([7, 55]); // circle will be between 7 and 55 px wide

    vis.pack = (data) =>
      d3.pack().size([vis.config.width, vis.config.height]).padding(3)(data);
    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append("svg");

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chart = vis.svg
      .attr("width", vis.config.width)
      .attr("height", vis.config.height)
      .attr(
        "viewBox",
        `-${vis.config.width / 2} -${vis.config.height / 2} ${
          vis.config.width
        } ${vis.config.height}`
      )
      .style("display", "block")
      .style("margin", "0px 0px 0px 0px")
      // .style("background", vis.color(0))
      .style("cursor", "pointer");
    vis.getData;
    // vis.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis(type, otherData) {
    let vis = this;
    if (type == true) {
      vis.data = otherData;
    }
    vis.dataset_hierarchy = d3
      .hierarchy(vis.data)
      .sum((d) => {
        return d.value;
      })
      .sort((a, b) => b.value - a.value);
    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;
    let root = vis.pack(vis.dataset_hierarchy);
    let focus = root;

    // Add nodes
    const nodes = vis.chart
      .append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
      .attr("fill", (d) => (d.children ? vis.color(d.depth) : "white"))
      .attr("stroke-width", 5)
      .attr("pointer-events", (d) => {
        if (d.depth == 5) {
          return "none";
        } else {
          return null;
        }
      })
      .attr("id", (d) => {
        return d.data.name;
      })
      .on("mouseover", function (d) {
        d3.select(this).attr("stroke", vis.color(d.depth));
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", null);
      })
      .on("mousemove", (event, d) => {
        vis.tooltipHelper(event, vis, d);
      })
      .on("click", (event, d) => {
        return (
          focus !== d &&
          (this.zoom(d, vis, event, nodes, label), event.stopPropagation())
        );
      });

    // Append legend

    const label = vis.chart
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .attr("class", "label")
      .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
      .style("display", (d) => (d.parent === root ? "inline" : "none"))
      .text((d) => {
        if (d.data.name != "python") {
          return `${d.data.name}  `;
        }
      });

    vis.zoomTo([root.x, root.y, root.r * 2], vis, nodes, label);

    vis.chart.on("click", (event, d) => {
      return vis.zoom(root, vis, event, nodes, label);
    });
    vis.getData = { vis: vis, root: root, nodes: nodes, label: label };
  }

  reset(vis, root, nodes, label) {
    nodes.remove();
    label.remove();
  }
  zoomTo(v, vis, node, label) {
    const k = vis.config.width / v[2];
    vis.view = v;
    label.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`
    );

    node
      .attr("transform", (d) => {
        return `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`;
      })
      .attr("r", (d) => {
        if (d.r == 0) {
          return k;
        }
        return d.r * k;
      });
  }

  zoom(d, vis, event, nodes, label) {
    focus = d;
    const transition = vis.chart
      .transition()
      .duration(event.altKey ? 15000 : 1500)
      .tween("zoom", (d1) => {
        const i = d3.interpolateZoom(vis.view, [focus.x, focus.y, focus.r * 2]);
        return (t) => {
          return this.zoomTo(i(t), vis, nodes, label);
        };
      });

    label
      .filter(function (d) {
        return d.parent === focus || this.style.display === "inline";
      })
      .transition(transition)
      .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
      .on("start", function (d) {
        if (d.parent === focus) this.style.display = "inline";
      })
      .on("end", function (d) {
        if (d.parent !== focus) this.style.display = "none";
      });
  }

  tooltipHelper(event, vis, d) {
    let root = d.parent.data.name == "python" || d.parent.data.name == "world";
    let type = d.depth == 2 ? "Module" : d.depth == 3 ? "Class" : "Methods";
    d3.select(".tooltip").style("opacity", 1);
    if (!root) {
      d3
        .select("#tooltip-right")
        .style("display", "block")
        .style("left", event.pageX + vis.config.tooltipPadding + "px")
        .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
      <div class="tooltip-title-right"> ${type} Information</div>
      <ui>
      <li> Parent: ${d.parent.data.name}</li>
      <li> View On ${type} : ${d.data.name}</li> 
      <li> Value ${d.value.toFixed(2)}</li>
      

      </ui>
`);
    }
  }
}
