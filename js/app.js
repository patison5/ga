var MERCATOR = {

  fromLatLngToPoint:function(latLng){
     var siny =  Math.min(Math.max(Math.sin(latLng.lat* (Math.PI / 180)), 
                                   -.9999),
                          .9999);
     return {
      x: 128 + latLng.lng * (256/360),
      y: 128 + 0.5 * Math.log((1 + siny) / (1 - siny)) * -(256 / (2 * Math.PI))
     };
  },

  fromPointToLatLng: function(point){

     return {
      lat: (2 * Math.atan(Math.exp((point.y - 128) / -(256 / (2 * Math.PI)))) -
             Math.PI / 2)/ (Math.PI / 180),
      lng:  (point.x - 128) / (256 / 360)
     };

  },

  getTileAtLatLng:function(latLng, zoom){
    var t=Math.pow(2,zoom),
        s=256/t,
        p=this.fromLatLngToPoint(latLng);
        return {x:Math.floor(p.x/s),y:Math.floor(p.y/s),z:zoom};
  },

  getTileBounds:function(tile){
    tile=this.normalizeTile(tile);
    var t=Math.pow(2,tile.z),
        s=256/t,
        sw={x:tile.x*s,
            y:(tile.y*s)+s},
        ne={x:tile.x*s+s,
            y:(tile.y*s)};
        return{sw:this.fromPointToLatLng(sw),
               ne:this.fromPointToLatLng(ne)
              }
  },
  normalizeTile:function(tile){
    var t=Math.pow(2,tile.z);
    tile.x=((tile.x%t)+t)%t;
    tile.y=((tile.y%t)+t)%t;
    return tile;
  }

}

var RENDER_SPEED = 1000;

var textDom = document.createElement('div');
textDom.className = "data-table__info";
textDom.innerHTML = "Russia";
document.getElementsByTagName('body')[0].appendChild(textDom);

var mapimg;
var ship = null;
var ships;

var currentPosDomElement  = null;
var arrivingPosDomElement = null;
var destinPosDomElement   = null;

var _isEnd = false;

var clat = -10;
var clon = 70;

var ww = 1024;
var hh = 800;

var zoom = 1;

// preloading backgound image
function preload() {
  // The clon and clat in this url are edited to be in the correct order.
  mapimg = loadImage('https://api.mapbox.com/styles/v1/mapbox/dark-v9/static/' +
    clon + ',' + clat + ',' + zoom + '/' +
    ww + 'x' + hh +
    '?access_token=pk.eyJ1IjoicGF0aXNvbjUiLCJhIjoiY2twMnlmZXRtMDV6aTJ3cjJ5bnJ4a3c1ZiJ9.H9pqDbqnHNnQZ3xXerqmkg');

  console.log(mapimg)
}

//calculation map X coordinate
function mercX(lon) {
  lon = radians(lon);
  var a = (256 / PI) * pow(2, zoom);
  var b = lon + PI;
  return a * b;
}

function mercX2lon(x) {
  return (PI * x / (256 * pow(2, zoom)) - PI) / PI * 180
}

//calculation map Y coordinate
function mercY(lat) {
  lat = radians(lat);
  var a = (256 / PI) * pow(2, zoom);
  var b = tan(PI / 4 + lat / 2);
  var c = PI - log(b);
  return a * c;
}

function mercY2lat(y) {
  var a = pow(2.718281828, PI - (y * PI / (256 * pow(2, zoom))))
  var b = atan(a - PI / 4)
  return b * 180 * 2 / PI
}
// function mercY2lat(y) {
//   var a = pow(2.718281828, (PI - y * PI / (256 * pow(2, zoom))))
//   return 2 * (atan(a) - PI / 4)
// }




// Ship class
const Ship = function (arriving, destination, safeArea, speed) {

  this.wayDots = []

  this._isMoving = true;
  this.safeAreaRadius = safeArea;

  this._isMainShip = false;

  //arriving from
  this.destinationLat = destination.latitue;
  this.destinationLon = destination.longtitude;
  this.destinationCountry = destination.country;

  //arriving to
  this.arrivingLat = arriving.latitue;
  this.arrivingLon = arriving.longtitude;
  this.arrivingCountry = arriving.country;

  //current location of this ship
  this.curLat = this.arrivingLat;
  this.curLon = this.arrivingLon;

  // map coordinates
  this.destinationCors = {
    x: mercX(this.destinationLon) - mercX(clon),
    y: mercY(this.destinationLat) - mercY(clat)
  }

  this.arrivingCors = {
    x: mercX(this.arrivingLon) - mercX(clon),
    y: mercY(this.arrivingLat) - mercY(clat)
  }

  this.currentCors = {
    x: mercX(this.curLon) - mercX(clon),
    y: mercY(this.curLat) - mercY(clat)
  }

  this.speed = {
    knot: speed,
    kmc: speed * 1.85,
    ms: speed * 0.51
  }


  // draw dest and arr points function
  this.drawMainPoints = function () {
    fill(255,0,255, 600);
    ellipse(this.arrivingCors.x,this.arrivingCors.y,12,12);
    ellipse(this.destinationCors.x,this.destinationCors.y,12,12)
  }


  //draw line between dst and arr points function
  this.drawLineBetweenPoints = function () {
    if (this._isMainShip)
      stroke(255);
    else 
      stroke(100);
    line(this.arrivingCors.x, this.arrivingCors.y, this.destinationCors.x, this.destinationCors.y);
  }


  // function that returns Y posistion
  this.getNewYPosition = function (x) {
    let x1 = this.destinationCors.x;
    let y1 = this.destinationCors.y;

    let x2 = this.arrivingCors.x;
    let y2 = this.arrivingCors.y;

    let y = (x - x1) / (x2 - x1) * (y2 - y1) + y1;

    return y;
  }


  //function that create a new position
  this.updatePosition = function () {
    // let delta = Math.abs(this.destinationCors.x - this.arrivingCors.x) / 100 + randomInteger(0, 2);
    let distance = this.getDistanceByPoints(this.destinationCors.x, this.destinationCors.y, this.arrivingCors.x, this.arrivingCors.y);
    let delta = this.speed.ms * 0.0001;
    console.log(delta)
    // return;
    // console.log(delta);

    if (this.currentCors.x > this.destinationCors.x) {
      this.currentCors.x -= delta;
      this.currentCors.y = this.getNewYPosition(this.currentCors.x)
    } else {
      this.currentCors.x += delta;
      this.currentCors.y = this.getNewYPosition(this.currentCors.x)
    }

    if (Math.abs(this.currentCors.x.toFixed(3) - this.destinationCors.x.toFixed(3)) < delta) {
      // _isEnd = true;
      this._isMoving = false;
      // noLoop();
    }

    setTimeout(() => {
      if (this._isMoving)
        this.updatePosition();
    }, RENDER_SPEED);
  }

  // function that draw Ship current position
  this.drawCurrentPosition = function () {
    fill(255,0,0, 1000);
    stroke(0);
    ellipse(this.currentCors.x,this.currentCors.y,10,10);
  }

   // function that draw Ship current position
  this.drawSafeArea = function () {
    fill(255,255,255, 0);
    stroke(255);
    ellipse(this.currentCors.x,this.currentCors.y,this.safeAreaRadius,this.safeAreaRadius)
  }

  this.drawNorth = function () {
    if (!this._isMainShip) return;

    fill(255,255,255, 0);
    stroke(100);

    // PFont f = createFont("Georgia", 20)
    // String s = "hello"

    // textFont(f)
    stroke(255);
    textSize(8)
    text("N", this.currentCors.x + 10, this.currentCors.y - 100)

      // line(this.currentCors.x,this.currentCors.y - 100,this.currentCors.x, this.currentCors.y + 100)

    for (let i = this.currentCors.y - 100; i < this.currentCors.y + 100; i = i + 5) {
      ellipse(this.currentCors.x,i,0.5,0.5)
    }
  }

  this.getDistanceByPoints = function (x1,y1,x2,y2) {
    let distance = Math.pow((Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2)),0.5)
    return distance;
  }

  this.drawInfoLines = function () {
    if (this._isMainShip) {
      // this.drawNorth()
       for (var i = 1; i < ships.length; i++) {
        let distance = this.getDistanceByPoints(this.currentCors.x, this.currentCors.y, ships[i].currentCors.x, ships[i].currentCors.y)
        if (distance < 90) {
          stroke(100);
          line(this.currentCors.x, this.currentCors.y, ships[i].currentCors.x, ships[i].currentCors.y);
        }
        if (distance < 20) {
          console.log("Угроза столкновения! Дистанция до угрожающего корабля " + distance)
        }
      }
    }
  }

  //function that shows the info about the [0] Ship
  this.showCurrentPositionOnMap = function () {
    // console.log(this.currentCors.x, this.currentCors.y)
    arrivingPosDomElement[0].innerHTML = "X: " + ships[0].arrivingCors.x;
    arrivingPosDomElement[1].innerHTML = "Y: " + ships[0].arrivingCors.y;

    destinPosDomElement[0].innerHTML = "X: " + ships[0].destinationCors.x;
    destinPosDomElement[1].innerHTML = "Y: " + ships[0].destinationCors.y;

    currentPosDomElement[0].innerHTML = "X: " + ships[0].currentCors.x;
    currentPosDomElement[1].innerHTML = "Y: " + ships[0].currentCors.y;
  }
}

Ship.prototype = {
  constructor : Ship,
};

function randomInteger(min, max) {
  var rand = min - 0.5 + Math.random() * (max - min + 1)
  rand = Math.round(rand);
  return rand;
}


function addNewRandomShip() {
  setTimeout(() => {
    var keys = Object.keys( ShipRoadPoints );

    var maxRandomInt1 = randomInteger(0,Object.keys(ShipRoadPoints).length - 1)
    var maxRandomInt2 = randomInteger(0,Object.keys(ShipRoadPoints).length - 1)

    var randomTown1 = ShipRoadPoints[keys[maxRandomInt1]]
    var randomTown2 = ShipRoadPoints[keys[maxRandomInt2]]

    ships.push(
      new Ship(randomTown1, randomTown2, 40)
    )

    ships[ships.length - 1].updatePosition();
    addNewRandomShip()
  }, randomInteger(2000, 6000));
}

function removeArrivedShipFromList (ship) {
  for (var i = 0; i < ships.length; i++) {
    if (!ships[i]._isMoving) {
      ships.splice(i, 1);
    }
  }
}



//********************************* SETUP *********************************
function setup() {
  createCanvas(ww, hh);

  ships = [
    // new Ship(ShipRoadPoints.A4, ShipRoadPoints.B4, 25, 30),
    new Ship(ShipRoadPoints.A4, ShipRoadPoints.B4, 25, 30),
    // new Ship(ShipRoadPoints.A1, ShipRoadPoints.B1, 25, 30),
    // new Ship(ShipRoadPoints.A2, ShipRoadPoints.B2, 20, 20),
    // new Ship(ShipRoadPoints.A3, ShipRoadPoints.B3, 30, 17),
  ]

  // ships[0].arrivingCors =  MERCATOR.fromLatLngToPoint({
  //   lat: ShipRoadPoints.A4.latitue,
  //   lng: ShipRoadPoints.A4.longtitude
  // })

  ships[0]._isMainShip = true;
  console.log(ships[0].speed)

  for (var id in ships) {
    ships[id].updatePosition()
  }

  currentPosDomElement  = document.getElementsByClassName('js-currentPos');
  arrivingPosDomElement = document.getElementsByClassName('js-arrivingPos');
  destinPosDomElement   = document.getElementsByClassName('js-destinPos');

  // addNewRandomShip()


  // console.log("ships[id]")
  // console.log(ShipRoadPoints.AT)
  var test = new Ship(ShipRoadPoints.A4, ShipRoadPoints.B4, 25, 30);
  let testCors = test.arrivingCors;

  // console.log(testCors)
  var startPoint = {
    lat: ShipRoadPoints.A4.latitue,
    lng: ShipRoadPoints.A4.longtitude
  }
  var mercPoint = MERCATOR.fromLatLngToPoint({
    lat: ShipRoadPoints.A4.latitue,
    lng: ShipRoadPoints.A4.longtitude
  })
  var merc2Point = {
    x: mercX(startPoint.lng) - mercX(clon),
    y: mercY(startPoint.lat) - mercX(clat)
  }

  var latFromPoint = MERCATOR.fromPointToLatLng({
    x: mercPoint.x,
    y: mercPoint.y
  })

  // var k = MERCATOR.getTileBounds(MERCATOR.normalizeTile({
  //   x: coord.x,
  //   y: coord.y,
  //   z:zoom
  // }))

  console.log(startPoint)
  console.log(latFromPoint)
  console.log("------------")
  console.log("mercPoint", mercPoint)
  console.log("merc2Point", merc2Point)

  console.log("startPoint", startPoint)
  console.log("1", {
    x: mercX(startPoint.lng),
    y: mercY(startPoint.lat)
  })

  console.log("startPoint", startPoint)
  console.log("2 ", {
    lat: mercY2lat(mercY(startPoint.lat)),
    lng: mercX2lon(mercX(startPoint.lng))
  })
  // {
  //   x: 164,
  //   y: 145
  // }
  // {
  //   lat: -23.24134610238612,
  //   lng: 50.625
  // }


  // console.log(testCors)

  // console.log(test.currentCors)

}

//********************************* DRAW *********************************

function draw () {

  if (!_isEnd) {
    clear()
    translate(width / 2, height / 2);

    imageMode(CENTER);
    image(mapimg, 0, 0);

    // removeArrivedShipFromList();

    for (var id in ships) {
        ships[id].drawLineBetweenPoints()
        ships[id].drawMainPoints();
        ships[0].showCurrentPositionOnMap();

        let X = mouseX - width / 2;
        let Y = mouseY - height / 2;

        if ((X < ships[id].destinationCors.x + 6) && (X > ships[id].destinationCors.x - 6)) {
          if ((Y < ships[id].destinationCors.y + 6) && (Y > ships[id].destinationCors.y - 6)) {
            textDom.innerHTML = ships[id].destinationCountry;

            textDom.style.left = ships[id].destinationCors.x + width / 2 + 10;
            textDom.style.top  = ships[id].destinationCors.y + height / 2 + 10;
          }
        }

        if ((X < ships[id].arrivingCors.x + 6) && (X > ships[id].arrivingCors.x - 6)) {
          if ((Y < ships[id].arrivingCors.y + 6) && (Y > ships[id].arrivingCors.y - 6)) {
            textDom.innerHTML = ships[id].arrivingCountry;

            textDom.style.left = ships[id].arrivingCors.x + width / 2 + 10;
            textDom.style.top  = ships[id].arrivingCors.y + height / 2 + 10;
          }
        }

        if ((X < ships[id].currentCors.x + 5) && (X > ships[id].currentCors.x - 5)) {
          if ((Y < ships[id].currentCors.y + 5) && (Y > ships[id].currentCors.y - 5)) {
            textDom.innerHTML = "Текущее местоположение:\n";
            textDom.innerHTML = "(" + ships[id].currentCors.x + ", " + ships[id].currentCors.y + ")";

            textDom.style.left = ships[id].currentCors.x + width / 2 + 10;
            textDom.style.top  = ships[id].currentCors.y + height / 2 + 10;
          }
        }
    }

    //thats need for showing the ship dots on the top of all other elements....
    for (var id in ships) {
      ships[id].drawSafeArea();
      ships[id].drawCurrentPosition();
      ships[id].drawNorth();
      ships[id].drawInfoLines();
    }
  }
}


