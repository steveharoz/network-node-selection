var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

var selected = [];
var graph;
var selectedNodes;
var links, nodes, texts;
var text;
var nodeIndices = [];
var is2D = true;
//var selectedIndices = [];


d3.json("miserables.json", function(error, _graph) {
  if (error) throw error;
  graph = _graph;
  firstDraw();
});


function firstDraw() {
    links = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links);

    nodes = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes);
    nodeIndices = d3.range(graph.nodes.length);

    text = svg.append("g")
        .attr("class", "text")
        .selectAll("text")
        .data(graph.nodes);

  simulation
      .nodes(graph.nodes)
      .on("tick", updateDraw);
  simulation.force("link")
      .links(graph.links);

  // perform node layout
  for (var i=0; i<1000; i++) {
      simulation.tick();
  }

  // compute link length
  for (var i=0; i<graph.links.length; i++) {
      var x = graph.links[i].source.x - graph.links[i].target.x;
      var y = graph.links[i].source.y - graph.links[i].target.y;
      graph.links[i].distance = Math.sqrt(x * x + y * y);
  } 
  graph.links = graph.links.sort( (a,b) => b.distance-a.distance );


  // stuff to do during force simulation
  function ticked() {
    // links
    //     .attr("x1",  d => selected.includes(d.id) ? d.source.x-10 : d.source.x)
    //     .attr("y1", function(d) { return d.source.y; })
    //     .attr("x2", function(d) { return d.target.x; })
    //     .attr("y2", function(d) { return d.target.y; });

    // nodes
    //     .attr("cx", function(d) { return d.x; })
    //     .attr("cy", function(d) { return d.y; });
  }

  links = links.enter().append("line")
    .attr("filter", "url(#linkShadow)");
  texts = text.enter().append("text")
    .attr("filter", "url(#shadow)");

  nodes = nodes.enter().append("circle")
      .attr("title", d => d.id)
      .on("click", function(d,i){
          console.log(d);
          var index = selected.indexOf(d.id);
          if (index >= 0) {
            selected.splice(index, 1);
            d.isSelected = false;
            d.hover = false;
          }
          else if(d != null) {
            selected.push(d.id);
            d.isSelected = true;
          }
          updateDraw();
      })
      .on("mouseenter", function(d,i){
          d.hover = true;
          updateDraw();
      })
      .on("mouseleave", function(d,i){
          d.hover = false;
          updateDraw();
      });
  updateDraw();
}

function updateDraw() {
  var transition = d3.transition()
    .duration(250);

  for (var n=0; n<graph.nodes.length; n++) {
      graph.nodes[n].selected = selectionProximity(graph.nodes[n].id);
      graph.nodes[n].selectedX = toSVGCoords(toWorldCoords(graph.nodes[n]), graph.nodes[n].selected).x;
      graph.nodes[n].selectedY = toSVGCoords(toWorldCoords(graph.nodes[n]), graph.nodes[n].selected).y;
  } 

  links
      .data(graph.links)
      .transition(transition)
      .style("stroke", d => color( graph.nodes.find(n => n.id == d.target.id).group ))
      .attr("stroke-width", d => Math.pow(Math.max( d.source.selected, d.target.selected),2)/1.5 + 1);
  nodes
      .data(nodeIndices.map(i => graph.nodes[i]))
      .transition(transition)
      //.attr("stroke-width", (d => 0*d.selected))
      .attr("r", d => d.selected*2 + 5)
      .attr("fill", d => d3.hcl(color(d.group)).brighter(3*(d.selected==2)) );
  texts
      .data(nodeIndices.map(i => graph.nodes[i]))
      .transition(transition)
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("visibility", d => d.isSelected || d.hover ? "visible" : "hidden")
      .attr("x", d => d.selectedX)
      .attr("y", d => d.selectedY - 13);

  // position
  links
      .transition(transition)
      .attr("x1", d => d.source.selectedX)
      .attr("y1", d => d.source.selectedY)
      .attr("x2", d => d.target.selectedX) 
      .attr("y2", d => d.target.selectedY);

  nodes
      .transition(transition)
      .attr("cx", d => d.selectedX)
      .attr("cy", d => d.selectedY);
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
  shift = 1 + thing.selected * shift * !is2D;
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