function onClickLinkUpdateHelper(
  vis,
  node,
  linkSelector,
  clickedStrokeWidth,
  unClickedStrokeWidth,
  nodeSelector,
  clickedOpacity,
  unClickedOpacity
) {
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
  d3.selectAll(linkSelector)
    .attr("stroke-width", (d) => {
      return d.click == 1 ? clickedStrokeWidth : unClickedStrokeWidth;
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

  d3.selectAll(nodeSelector).attr("opacity", (d) => {
    if (d.isClick == 1) {
      return clickedOpacity;
    } else {
      return unClickedOpacity;
    }
  });
}
