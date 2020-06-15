/* eslint-env jquery, browser */

$(document).ready(() => {

    //$('#plants').tablesorter();
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

///// MOD GEN
// for (var n = 0; n < 10; n++) {
//   for (var i = 0; i < 4; i++) {
//     // array[i]
//     var circle = draw.circle(40, 40).attr({ fill: 'blue' , cy: i*75 + 30, cx: n*90+30}).data('key', {x,y})
//     console.log(i, circle.node);
//     circle.click(function() {
//       this.fill({ color: color })
//       var a = this.data('key')
//       plantMatrix.push({color: color, location:a });
//       //plantMatrix.push([color, a]);
//       console.log(color, this.data('key'));
//       console.log(JSON.stringify(plantMatrix));
//       document.getElementById("individualPlants").value = JSON.stringify(plantMatrix);
//
//
//     })
//   }
// }

  //var color = 'red'


}

function circleColor(x,y,modId){

if (true) {

}
  else {
    var circle = draw.circle(40, 40).attr({ fill: 'grey' , opacity: 0.3, cy: i*75 + 30, cx: n*90+30}).data('key', {x,y})

  }
}
var array = 30
function drawMod(shape, modId){
  var draw = SVG().addTo('#circle_1').size(900, 300)
  console.log(shape);
  if (shape == 'Rtriangle') {
    var triangle = draw.polygon('0,0 900,1300 900,0').fill('green').stroke({ width: 1 })
  }
  if (shape == 'Ltriangle') {
    var triangle = draw.polygon('0,0 900,300 900,0').fill('green').stroke({ width: 1 })
  }
  if (shape == 'rectangle') {
    var rect = draw.rect(900, 300).attr({ fill: 'green' })
  }
  // var rect = draw.rect(900, 300).attr({ fill: 'green' })
  // var triangle = draw.polygon('0,0 900,300 300,0').fill('green').stroke({ width: 1 })
  //

  var fillcolor = ['yellow','red', 'blue']
  var fillcolor = ['#7FD674','#A9E079','#BAC977','#E0DB79','#D6C874']
  pselect = [];

    for (var n = 0; n < 10; n++) {
      for (var i = 0; i < 4; i++) {
        // array[i]
        var plant = checkPlants(modId, n,i)
        console.log(plant);
       //var circle = draw.circle(40, 40).attr({ fill: 'grey' , opacity: 0.3, cy: i*75 + 30, cx: n*90+30}).data('key', {n,i})
       if (plant) {
         if (pselect.length<1) {
           var circle = draw.circle(40, 40).attr({ fill: 'red' , opacity: 0.3, cy: i*75 + 30, cx: n*90+30}).data('key', {x,y})
           pselect.push(plant["plant"])
           $('#plant1').val("plant");

         }
         if (pselect.includes(plant["plant"])) {
           var circle = draw.circle(40, 40).attr({ fill: 'red' , opacity: 0.3, cy: i*75 + 30, cx: n*90+30}).data('key', {x,y})
         }
       }
       else {
         var circle = draw.circle(40, 40).attr({ fill: 'grey' , opacity: 0.3, cy: i*75 + 30, cx: n*90+30}).data('key', {x,y})
       }
        //var circle = circleColor(n,i);
        //console.log(i, circle.node);
        circle.click(function() {
          this.fill({ color: color, opacity: 1 })
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


  function checkIfModExists(data, x,y) {
      var i, len = data.length;

      for (i = 0; i < len; i++) {
          if (data[i] && data[i].hasOwnProperty("x")) {
            if (data[i]["y"]== y &&data[i]["x"]==x) {
              //console.log(data[i]["y"]);
              return data[i]
            }
          }
      }

      return false;
  }
  function checkPlants(modId,x,y) {
      var article = document.querySelector('#modMap');
      console.log(article.dataset);
      var data = JSON.parse(article.dataset.plantedplants)
      var len = data.length;
      for (i = 0; i < len; i++) {
          if (data[i] && data[i].hasOwnProperty("module")) {
            if (data[i]["module"]==modId) {
            if (data[i]["y"]== y &&data[i]["x"]==x) {
              //console.log(data[i]["y"]);
              return data[i]
            }
            }
          }
      }

      return false;
  }

function modMap() {
  var draw = SVG().addTo('#modMap').size(400,3800)
  var article = document.querySelector('#modMap');
  console.log(article.dataset);
  var allMods =JSON.parse(article.dataset.mods);
  var defaultColor='grey'
  console.log(allMods[0]["x"]);

  //var rect = draw.rect(60, 20).attr({ fill: '#189968' }).stroke({ color: '#5ECCA2',  width: 2 })
  var wide = 30;
    for (var n = 0; n < 30; n++) {
      for (var i = 0; i < 10; i++) {
        // array[i]
        color = '#189968'
        var x = 200-n
        var y = i
        //getValueByKey("x", data)
        // if (article[0].["x"] == x) {
        //      console.log(x,'found');
        //  }
        t = checkIfModExists(allMods, x,i)
        //console.log(t);
        if (t) {
          var defaultColor = color
          var op = 1
          var id = t["_id"]
          // if(document.querySelector('#map')){
          //   AddModToMap(x,i,id,'R3');
          // };

          if(t["shape"]== "R3"){
            var rect = draw.rect(20, 60).attr({ fill: defaultColor , opacity: op, x: i*20, y: n*60}).data('key', {x,y}).stroke({ color: '#5ECCA2', width: 1 })
          }
          if(t["shape"]== "T3"){
            if(t["orientation"]=="Ascend"){
              var rect = draw.polygon('0,0 60,20 60,0').attr({ fill: defaultColor , opacity: op, x: i*20, y: n*60}).data('key', {x,y}).stroke({ color: '#5ECCA2', width: 1 })

            }
            if(t["orientation"]=="Decend"){
              var rect = draw.polygon('0,0 60,20 60,0').attr({ fill: defaultColor , opacity: op, x: i*20, y: n*60}).data('key', {x,y}).stroke({ color: '#5ECCA2', width: 1 })

            }
            var rect = draw.rect(20, 60).attr({ fill: defaultColor , opacity: op, x: i*20, y: n*60}).data('key', {x,y}).stroke({ color: '#5ECCA2', width: 1 })

          }
          if(t["shape"]== "R3"){
            var rect = draw.rect(20, 60).attr({ fill: defaultColor , opacity: op, x: i*20, y: n*60}).data('key', {x,y}).stroke({ color: '#5ECCA2', width: 1 })
          }
        }
        else {
          defaultColor = 'white'
          op = 1
          var rect = draw.rect(20, 60).attr({ fill: defaultColor , opacity: op, x: i*20, y: n*60}).data('key', {x,y}).stroke({ color: '#5ECCA2', width: 1 })

        }

        var g = i*20
        var h = n*60

        // text.move(x: g, y: h).font({ fill: '#f06', family: 'Inconsolata' });



        rect.click(function() {
          document.getElementById("x").value = this.data('key')["x"];
          document.getElementById("y").value = this.data('key')["y"];
          $("#newmod").modal()
          console.log(t);
          drawMod(t["shape"],t["id"])
          this.fill({ color: color })
          var a = this.data('key')["n"]
          console.log(a);
          // plantMatrix.push({color: color, location:a });
          //plantMatrix.push([color, a]);



        })
      }
      var local = x
      console.log(local);
      var text = draw.text(local.toString()).attr({ opacity: op, x: i*20-6 , y: n*60+12}).rotate(90);
    }

};

function genMap(){
mapboxgl.accessToken = 'pk.eyJ1IjoidXJiYW5yaXYiLCJhIjoiY2p2bzlrd3M5MWIyYTQ4bXVrMHBqenFuOSJ9.h4IOiqxHX7IhYsAp2EFe7A';
var map = new mapboxgl.Map({
  container: 'map',
  center: [-87.654251666, 41.90960833],
  bearing: -30.6,
  zoom: 19,
  interactive: true,
  "light": {
    "anchor": "viewport",
    "color": "white",
    "intensity": 0.4
  },
  // "transition": {
  //   "duration": 300,
  //   "delay": 0
  // },
  style: 'mapbox://styles/mapbox/streets-v11',
  //mapbox://styles/mapbox/satellite-v9'

});
 }


 /// Todo PAUL////
 /////////////////
function locationArray(x,y,modType){
  var slx = 41.90636
  var sly = -87.65157
  var sAngle = 45

  if (modType=='R3') {
    hx =  (0.00003	* x)+slx
    hy =  (0.00001	* y)+sly
    ix =  0.00003+hy
    iy =  0.00001+iy
  }
}

function AddModToMap(x,y,modId,modType){
// Source location
// [p1, p2],
// [p2, p3],
// [p3, p4],
// [p4, p1]
// [-87.65157, 41.90636],
// [-87.65153, 41.90638],
// [-87.65159, 41.90639],
// [-87.65155, 41.9064]
var slx = 41.90636
var sly = -87.65157
var sAngle = 45

if (modType=='R3') {
  hx =  (0.00003	* x)+slx
  hy =  (0.00001	* y)+sly
  ix =  0.00003+hx
  iy =  0.00001+hy
}
console.log(  [hx, iy],
  [hx, hy],
  [ix, hy],
  [ix, iy]);
map.addSource(modId, {
'type': 'geojson',
'data': {
'type': 'Feature',
'geometry': {
'type': 'Polygon',
'coordinates': [[
  [hx, iy],
  [hx, hy],
  [ix, hy],
  [ix, iy]
]]
}
}
});
map.addLayer({
'id': modId,
'type': 'fill',
'source': modId,
'layout': {},
'paint': {
'fill-color': '#189968',
'fill-opacity': 0.8
}
});
};
// map.on('load', function() {
// map.addSource('maine', {
// 'type': 'geojson',
// 'data': {
// 'type': 'Feature',
// 'geometry': {
// 'type': 'Polygon',
// 'coordinates': [
// [
// [-67.13734351262877, 45.137451890638886],
// [-67.13734351262877, 45.137451890638886]
// ]
// ]
// }
// }
// });
// map.addLayer({
// 'id': 'maine',
// 'type': 'fill',
// 'source': 'maine',
// 'layout': {},
// 'paint': {
// 'fill-color': '#088',
// 'fill-opacity': 0.8
// }
// });
// });
function selector1(){
  var draw = SVG().addTo('#selector1').size(40,80)
  var selecter1 = draw.circle(40,40).attr({fill: 'orange', cx: 20, cy: 20})
  selecter1.on('click', function(e) {
    clicker(selecter1,'1');
    console.log(e);
  })
}

function selector2(){
  var draw = SVG().addTo('#selector2').size(40,80)
  var selecter2 = draw.circle(40,40).attr({fill: 'red', cx: 20, cy: 20})
  selecter2.on('click', function(e) {
    clicker(selecter2,'2');
    console.log(e);
  })

}function selector3(){
  var draw = SVG().addTo('#selector3').size(40,80)
  var selecter3 = draw.circle(40,40).attr({fill: 'yellow', cx: 20, cy: 20})
  selecter3.on('click', function(e) {
    clicker(selecter3,'3');
  })
}
function selector4(){
  var draw = SVG().addTo('#selector3').size(40,80)
  var selecter4 = draw.circle(40,40).attr({fill: 'yellow', cx: 20, cy: 20})
  selecter4.on('click', function(e) {
    clicker(selecter3,'4');
  })
}
function selector5(){
  var draw = SVG().addTo('#selector3').size(40,80)
  var selecter5 = draw.circle(40,40).attr({fill: 'yellow', cx: 20, cy: 20})
  selecter5.on('click', function(e) {
    clicker(selecter3,'5');
  })
}
// var click = function() {
// selecter2.stroke({ color: 'black', opacity: 0.6, width: 2 })
// color = 'orange'
// }
function clicker(ss,sel){

  // selecter1.stroke({ color: 'black', opacity: 0.6, width: 0 })
  ss.stroke({ color: 'black', opacity: 0.6, width: 2 })
  color = ss.attr('fill')

}

function draw_map(x,y) {
  rectSizeX = 60
  rectSizeY = 20
  rx = x * 60
  ry = y * 20

  var draw = SVG().addTo('#modmap').size(900, 300)
  var rect = draw.rect(60, 20).attr({ fill: '#189968' }).stroke({ color: '#5ECCA2',  width: 2 })


};

//drawMod('triangle');

//draw_circle();
//draw_map();

selector1();
selector2();
selector3();
window.onload = function() {
  // map.on('load', function() {
  // //modMap();
  // });
function individualPlants(){
  document.getElementById("individualPlants").value = plantMatrix;
  console.log(plantMatrix,'pm');
  return plantMatrix

}

}
modMap();

});

function individualPlants(){
  document.getElementById("individualPlants").value = plantMatrix;
  console.log(plantMatrix,'pm');
  return plantMatrix

}
