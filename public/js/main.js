/* eslint-env jquery, browser */

$(document).ready(() => {

  // Place JavaScript code here...
  // $(function(){
  //   $('#keywords').tablesorter();
  // });
plantMatrix = [];

function draw_circle() {

  var draw = SVG().addTo('#circle_1').size(900, 300)
  var rect = draw.rect(900, 300).attr({ fill: 'green' })

  var fillcolor = ['yellow','red', 'blue']

  // var selecter1 = draw.circle(40,40).attr({fill: 'orange', cx: 950, cy: 75})
  // var selecter2 = draw.circle(40,40).attr({fill: 'yellow', cx: 950, cy: 150})
  // var selecter3 = draw.circle(40,40).attr({fill: 'yellow', cx: 950, cy: 225})

  // var circle = draw.circle(100, 100).attr({ fill: 'blue' , cy: '30'})


// var click = function(x) {
//   if (x=1) {
//     selecter1.stroke({ color: 'black', opacity: 0.6, width: 2 })
//     color = 'yellow'
//   }
// }

// SVG.Rounded = class extends SVG.Rect{
//   // Create method to proportionally scale the rounded corners
//   size: function(cx, cy, color) {
//     return this.attr({
//       width:  40
//     , height: 50
//     , cx: cx
//     , cy: cy
//     , fill, color
//     })
//   }
// })
//
// // Add a method to create a rounded rect
// SVG.extend(SVG.Container,  {
//   // Create a rounded element
//   rounded: function(width, height) {
//     return this.put(new SVG.Rounded).size(width, height)
//   }
// }


// change the fill of all elements in the set at once


// var click = function() {
// selecter2.stroke({ color: 'black', opacity: 0.6, width: 2 })
// color = 'orange'
// }
//
//
// function select(number,selection) {
//   c = fillcolor[number]
//   selection.stroke({ color: c, opacity: 0.6, width: 2 })
//   color = c
// }
// var j = console.log(draw.index(selecter1))
// selecter1.on('click', function(e) {
//   // do something
//   console.log(e);
// })
//
// selecter2.on('click', click)
// selecter3.on('click', click)


  //var color = 'red'
  var array = 30
  for (var n = 0; n < 10; n++) {
    for (var i = 0; i < 4; i++) {
      // array[i]
      var circle = draw.circle(40, 40).attr({ fill: 'blue' , cy: i*75 + 30, cx: n*90+30}).data('key', {i,n})
      console.log(i, circle.node);
      circle.click(function() {
        this.fill({ color: color })
        var a = this.data('key')
        plantMatrix.push({color: color, location:a });
        //plantMatrix.push([color, a]);
        console.log(color, this.data('key'));
        console.log(JSON.stringify(plantMatrix));
        document.getElementById("individualPlants").value = JSON.stringify(plantMatrix);


      })
    }
  }
}

function selector1(){
  var draw = SVG().addTo('#selector1').size(40,80)
  var selecter1 = draw.circle(40,40).attr({fill: 'orange', cx: 20, cy: 20})
  selecter1.on('click', function(e) {
    clicker(selecter1);
    console.log(e);
  })
}

function selector2(){
  var draw = SVG().addTo('#selector2').size(40,80)
  var selecter2 = draw.circle(40,40).attr({fill: 'red', cx: 20, cy: 20})
  selecter2.on('click', function(e) {
    clicker(selecter2);
    console.log(e);
  })

}function selector3(){
  var draw = SVG().addTo('#selector3').size(40,80)
  var selecter3 = draw.circle(40,40).attr({fill: 'yellow', cx: 20, cy: 20})
  selecter3.on('click', function(e) {
    clicker(selecter3);
  })
}

// var click = function() {
// selecter2.stroke({ color: 'black', opacity: 0.6, width: 2 })
// color = 'orange'
// }
function clicker(ss){

  // selecter1.stroke({ color: 'black', opacity: 0.6, width: 0 })
  ss.stroke({ color: 'black', opacity: 0.6, width: 2 })
  color = ss.attr('fill')

}



draw_circle();

selector1();
selector2();
selector3();
window.onload = function() {

function individualPlants(){
  document.getElementById("individualPlants").value = plantMatrix;
  console.log(plantMatrix,'pm');
  return plantMatrix

}

}

});

function individualPlants(){
  document.getElementById("individualPlants").value = plantMatrix;
  console.log(plantMatrix,'pm');
  return plantMatrix

}
