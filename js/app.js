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

var zoom = 3.5;
const simulationSpeed = 1000; 

// preloading backgound image
function preload() {
  // The clon and clat in this url are edited to be in the correct order.
  mapimg = loadImage('https://api.mapbox.com/styles/v1/mapbox/dark-v9/static/' +
    clon + ',' + clat + ',' + zoom + '/' +
    ww + 'x' + hh +
    '?access_token=pk.eyJ1IjoicGF0aXNvbjUiLCJhIjoiY2twMnlmZXRtMDV6aTJ3cjJ5bnJ4a3c1ZiJ9.H9pqDbqnHNnQZ3xXerqmkg');

  // console.log(mapimg)
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
  // console.log("lat:", lat)
  lat = radians(lat);
  var a = (256 / PI) * pow(2, zoom);
  var b = tan(PI / 4 + lat / 2);
  var c = PI - log(b);
  // console.log("a:", b, log(b))
  return a * c;
}

function mercY2lat(y) {
  var a = pow(Math.E, (PI - y * PI / (256 * pow(2, zoom))))
  return degrees(2 * (atan(a) - PI / 4))
}


// Ship class
const Ship = function (arriving, destination, safeArea, speed) {

  this.wayDots = []
  this.currentWayIndex = 2;

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

    if (this._isMainShip && this.wayDots.length > 0) {
      for (var i = 0; i < this.wayDots.length; i++) {
        var x = this.wayDots[i].x;
        var y = this.wayDots[i].y;
        ellipse(x, y, 12, 12);
      }

      fill(255,255,255, 1000);
      stroke(0);
      textSize(12)
      text("A", this.wayDots[0].x + 10, this.wayDots[0].y + 10)
      text("B", this.wayDots[this.wayDots.length - 1].x + 10, this.wayDots[this.wayDots.length - 1].y + 10)
      fill(255,0,255, 600);
    } else {
      ellipse(this.arrivingCors.x,this.arrivingCors.y,12,12);
      ellipse(this.destinationCors.x,this.destinationCors.y,12,12)
    }
  }


  //draw line between dst and arr points function
  this.drawLineBetweenPoints = function () {
    if (this._isMainShip) {
      stroke(255);
      for (var i = 0; i < this.wayDots.length - 1; i++) {
        line(this.wayDots[i].x, this.wayDots[i].y, this.wayDots[i+1].x, this.wayDots[i+1].y);
      }
    }
    else {
      stroke(100);
      line(this.arrivingCors.x, this.arrivingCors.y, this.destinationCors.x, this.destinationCors.y);
    }
    
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
    // let distance = this.getDistanceByPoints(this.destinationCors.x, this.destinationCors.y, this.arrivingCors.x, this.arrivingCors.y);

    // let distance = this.getDistanceByPoints(this.currentCors.x, this.currentCors.y, this.arrivingCors.x, this.arrivingCors.y);
    // var latlon = {
    //   x: mercX2lon(this.currentCors.x),
    //   y: mercY2lat(this.currentCors.y)
    // }

    // latlon.x = latlon.x + 0.0001 * this.speed.ms
    // latlon.y = latlon.y + 0.0001 * this.speed.ms

    // var newCors = {
    //   x: mercX(latlon.x),
    //   y: this.getNewYPosition(mercX(latlon.x))
    // }

    // var distance = this.getDistanceByPoints(this.currentCors.x, this.currentCors.y, newCors.x, newCors.y) * 200;
    // let distance = this.getDistanceByPoints(this.destinationCors.x, this.destinationCors.y, this.arrivingCors.x, this.arrivingCors.y);
    let distance = Math.abs(this.destinationCors.x - this.arrivingCors.x) * this.speed.ms * 0.001619140460156832;
    if (this._isMainShip) {
      console.log("DISTANCE", distance)
    }

    if (this.currentCors.x > this.destinationCors.x) {
      this.currentCors.x -= distance;
      this.currentCors.y = this.getNewYPosition(this.currentCors.x)
    } else {
      this.currentCors.x += distance;
      this.currentCors.y = this.getNewYPosition(this.currentCors.x)
    }

    if (Math.abs(this.currentCors.x.toFixed(3) - this.destinationCors.x.toFixed(3)) < distance) {
      this._isMoving = false;

      if (this._isMainShip) {
        if (this.currentWayIndex < this.wayDots.length) {
          this._isMoving = true;

          this.arrivingCors = {
            x: this.wayDots[this.currentWayIndex - 1].x,
            y: this.wayDots[this.currentWayIndex - 1].y
          }
          this.destinationCors = {
            x: this.wayDots[this.currentWayIndex].x,
            y: this.wayDots[this.currentWayIndex].y
          }

          this.currentWayIndex = this.currentWayIndex + 1;
          console.log("Сменили на следующую точку")
          console.log(this.currentWayIndex)
          console.log(this.destinationCors)
        }
      }
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
        var distance = this.getDistanceByPoints(this.currentCors.x, this.currentCors.y, ships[i].currentCors.x, ships[i].currentCors.y)
        if (distance < 100) {
          stroke(100);
          line(this.currentCors.x, this.currentCors.y, ships[i].currentCors.x, ships[i].currentCors.y);


          let latlon1 = {
            x: mercX2lon(this.currentCors.x),
            y: mercY2lat(this.currentCors.y)
          }

          let latlon2 = {
            x: mercX2lon(ships[i].currentCors.x),
            y: mercY2lat(ships[i].currentCors.y)
          }

          // var norDistance = this.getDistanceByPoints(latlon1.x, latlon1.y, latlon2.x, latlon2.y)
          var norDistance = mercX2lon(this.currentCors.x) - mercX2lon(ships[i].currentCors.x) * simulationSpeed

          // console.log(norDistance)

          var lat1 = mercY2lat(this.currentCors.y);
          var lat2 = mercY2lat(ships[i].currentCors.y);
          var lon1 = mercX2lon(this.currentCors.x);
          var lon2 = mercX2lon(ships[i].currentCors.x);

          const R = 6371e3; // metres
          const φ1 = lat1 * Math.PI/180; // φ, λ in radians
          const φ2 = lat2 * Math.PI/180;
          const Δφ = (lat2-lat1) * Math.PI/180;
          const Δλ = (lon2-lon1) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

          var d = R * c; // in metres

          d = d / 100 / zoom;

          stroke(255);
          textSize(8)
          text(d.toFixed(2)+"", (this.currentCors.x + ships[i].currentCors.x) / 2, (this.currentCors.y + ships[i].currentCors.y) / 2)
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

  gen.start()

  ships = [
    // new Ship(ShipRoadPoints.A4, ShipRoadPoints.B4, 25, 30),
    new Ship(ShipRoadPoints.A4, ShipRoadPoints.B4, 25, 30),
    new Ship(ShipRoadPoints.A2, ShipRoadPoints.B2, 20, 40),
    new Ship(ShipRoadPoints.A3, ShipRoadPoints.B3, 30, 40),
  ]

  // ships[0].arrivingCors =  MERCATOR.fromLatLngToPoint({
  //   lat: ShipRoadPoints.A4.latitue,
  //   lng: ShipRoadPoints.A4.longtitude
  // })

  ships[0]._isMainShip = true;
  // for (var i = 0; i < gen.bestRoad.wayDots.length; i++)
  //   ships[0].wayDots.push(gen.bestRoad.wayDots[i]);
  // ships[0].wayDots = gen.bestRoad.wayDots;
  // console.log(ships[0].speed)

  console.log("ships[0].wayDots", ships[0].wayDots)

  for (var i = 0; i < gen.bestRoad.wayDots.length; i++){
    var x = gen.bestRoad.wayDots[i].x - mercX(clon);
    var y = gen.bestRoad.wayDots[i].y - mercY(clat);
    ships[0].wayDots.push(new GPoint(y, x));
  }

  console.log(ships[0].destinationCors)
  ships[0].destinationCors = {
    x: ships[0].wayDots[1].x,
    y: ships[0].wayDots[1].y
  }

  console.log("debug", ships[0].destinationCors)
  console.log("###", ships[0].wayDots)
  console.log(gen.bestRoad.wayDots)

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

  // console.log(startPoint)
  // console.log("CHECKING BLYAT", startPoint.lng, mercX2lon(mercX(startPoint.lng)))
  // console.log("CHECKING BLYAT", startPoint.lat, mercY2lat(mercY(startPoint.lat)))
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
        // noLoop()
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


