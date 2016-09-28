var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

var selected = ["CountessdeLo"];

d3.json("miserables.txt", function(error, _graph) {
  if (error) throw error;
  graph = _graph;
  firstDraw();
});

var graph;
var link;
var node;
var link4Tick, node4Tick;
var nodeIndices = [];
var is2D = true;
//var selectedIndices = [];


function firstDraw() {
  link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links);

  node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes);
 nodeIndices = d3.range(graph.nodes.length);

  node.append("title")
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", updateDraw);
  simulation.force("link")
      .links(graph.links);

  for (var i=0; i<1000; i++) {
      simulation.tick();
  }

  function ticked() {
    link4Tick
        .attr("x1", d => selected.includes(d.id) ? d.source.x-10 : d.source.x)
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node4Tick
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

  link4Tick = link.enter().append("line");

  node4Tick = node.enter().append("circle")
      .attr("title", d => d.id)
      .on("click", function(d,i){
          console.log(d);
          var index = selected.indexOf(d.id);
          if (index >= 0)
            selected.splice(index, 1);
          else if(d != null)
            selected.push(d.id);
          d.selected = true;
          updateDraw();
      });
  updateDraw();
}

function updateDraw() {
  var transition = d3.transition()
    .duration(0);

  for (var n=0; n<graph.nodes.length; n++) {
      graph.nodes[n].selected = selectionProximity(graph.nodes[n].id);
  } 

  link4Tick
      .data(graph.links)
      .transition(transition)
      .style("stroke", d => color( graph.nodes.find(n => n.id == d.target.id).group ))
      .attr("stroke-width", d => Math.pow(Math.max( d.source.selected, d.target.selected),2) + 1);
  node4Tick
      .data(nodeIndices.map(i => graph.nodes[i]))
      .transition(transition)
      .attr("stroke-width", (d => 0*d.selected))
      .attr("r", d => d.selected*2 + 5)
      .attr("fill", d => d3.hcl(color(d.group)).brighter(d.selected*1) );

  // position
  link4Tick
      //.transition(transition)
      .attr("x1", d => toSVGCoords(toWorldCoords(d.source), d.source.selected).x)
      .attr("y1", d => toSVGCoords(toWorldCoords(d.source), d.source.selected).y)
      .attr("x2", d => toSVGCoords(toWorldCoords(d.target), d.target.selected).x)
      .attr("y2", d => toSVGCoords(toWorldCoords(d.target), d.target.selected).y);

  node4Tick
      .transition(transition)
      .attr("cx", d => toSVGCoords(toWorldCoords(d), d.selected).x)
      .attr("cy", d => toSVGCoords(toWorldCoords(d), d.selected).y);
}

function selectionProximity(id) {
    // id is selected?
    if (selected.includes(id))
        return 2;
    // id's neighbor is selected?
    var neighbors1 = graph.links.filter(edge => edge.source.id == id).map(edge => edge.target.id);
    var neighbors2 = graph.links.filter(edge => edge.target.id == id).map(edge => edge.source.id);
    var neighbors = neighbors1.concat(neighbors2);
    if (neighbors.filter(n => selected.includes(n)).length > 0)
        return 1;

    // // id's neighbor's neighbor is selected?
    // for (var i=0; i<neighbors.length; i++) {
    //     var neighbor = neighbors[i];
    //     neighbors1 = graph.links.filter(edge => edge.source.id == neighbor).map(edge => edge.target.id);
    //     neighbors2 = graph.links.filter(edge => edge.target.id == neighbor).map(edge => edge.source.id);
    //     var neighborsneighbors = neighbors1.concat(neighbors2);
    //     if (neighborsneighbors.filter(n => selected.includes(n)).length > 0)
    //         return 1;
    // }
    return 0;
}

function toWorldCoords(thing, shift=.25) {
  shift = 1 + thing.selected * shift * is2D;
  return {
    x: (thing.x / width * 2 - 1) * shift,
    y: (thing.y / height * 2 - 1) * shift
  }
}

function toSVGCoords(thing) {
  return {
    x: (thing.x + 1) / 2 * width,
    y: (thing.y + 1) / 2 * height
  }
}