
var GMath = { 
	PI: Math.PI,
	zoom: 3.5,

	fromMeterToCabelt:function(m){

		return m * 185.2;
	},

	fromMeterToMercator: function (m, zoom) {
		if (zoom == 1) 
			return m * 0.000286226299621671;
		if (zoom == 2)
			return m * 0.000572452599243342;
		if (zoom == 3) 
			return m * 0.001144905198486684;
		if (zoom == 3.5)
			return m * 0.001619140460156832;
		if (zoom == 4)
			return m * 0.002289810396973368;
		return "отбъебитесь"
	},

	//calculation map X coordinate
	mercX(lon) {
		lon = this.radians(lon);
		var a = (256 / this.PI) * Math.pow(2, this.zoom);
		var b = lon + this.PI;
		return a * b;
	},

	mercX2lon(x) {

		return (this.PI * x / (256 * Math.pow(2, this.zoom)) - this.PI) / this.PI * 180
	},

	//calculation map Y coordinate
	mercY(lat) {
		lat = this.radians(lat);
		var a = (256 / this.PI) * Math.pow(2, this.zoom);
		var b = Math.tan(this.PI / 4 + lat / 2);
		var c = this.PI - Math.log(b);
		// console.log("a:", b, log(b))
		return a * c;
	},

	mercY2lat(y) {
		var a = Math.pow(Math.E, (Math.Pi - y * Math.Pi / (256 * Math.pow(2, this.zoom))))
		return Math.degrees(2 * (Math.atan(a) - Math.Pi / 4))
	},

	radians(degrees) {

	  return degrees * (Math.PI/180);
	},

	randomInteger(min, max) {
		var rand = min - 0.5 + Math.random() * (max - min + 1)
		rand = Math.round(rand);
		return rand;
	},

	div (a, b) {
	    return (a - a % b) / b;
	},
}

class GPoint {
	constructor(lat, lon) {
		this.y = lat;
		this.x = lon;
	}
}


class GRoad {
	constructor(arrayOfPoints) {
		this.wayDots  = arrayOfPoints;
	}
}
class GShip {
	constructor(start, finish, speed, radius) {
		this.start = start;
		this.finish = finish;
		this.speed = speed;
		this.radius = radius;
	}
}

class Genetic {
	constructor(amountOfPopulations, amountOfCircles, concuredShips, selfSpeed, selfRadius, selfStart, selfFinish) {
		this.amountOfPopulations = amountOfPopulations;
		this.amountOfCircles = amountOfCircles;
		this.concuredShips = concuredShips;
		this.selfSpeed = selfSpeed;
		this.selfRadius = selfRadius;
		this.selfStart = selfStart;
		this.selfFinish = selfFinish;
		this.childrenRoads = [];

		for (var i = 0; i < 5; i++) {
			var newWay = new GRoad([
				selfStart,
				new GPoint(GMath.randomInteger(selfStart.y, selfFinish.y), GMath.randomInteger(selfStart.x, selfFinish.x)),
				new GPoint(GMath.randomInteger(selfStart.y, selfFinish.y), GMath.randomInteger(selfStart.x, selfFinish.x)),
				new GPoint(GMath.randomInteger(selfStart.y, selfFinish.y), GMath.randomInteger(selfStart.x, selfFinish.x)),
				new GPoint(GMath.randomInteger(selfStart.y, selfFinish.y), GMath.randomInteger(selfStart.x, selfFinish.x)),
				selfFinish
			])

			this.childrenRoads.push(newWay)
		}
	};

	fullRoad() { }

	start() {
		for (var start = 0; start < this.amountOfCircles; start++) {
			this.selection();
			this.crossing();
			this.mutating();
		}
	}

	selection() {
		for (var i = 0; i < this.childrenRoads.length; i++) {
			let road = this.childrenRoads[i];
			let wayDots = road.wayDots;

			for (var ship in this.concuredShips) {
				for (var j = 0; j < GMath.div(wayDots.length, 2); j++) {
					// console.log(wayDots)
					//1. найти пересечения на этих участках.
					//2. найти точки пересечения
					// --
					//1. находим время прохождения до этой точки 
					//2. смотрим, где находится вражеский корабль по истечении данного времени
					//3. Если дистанция является наикратчайшей - все, пизда рулю

					 
				}
			}
		}
	}

	crossing() { }
	mutating() { }
}


var gen = new Genetic(1, 1, [
		new GShip(new GPoint(GMath.mercY(-15.0), GMath.mercX(53.0)), new GPoint(GMath.mercY(-22.0), GMath.mercX(90.0)), 40, 20),
		new GShip(new GPoint(GMath.mercY(-5.0), GMath.mercX(50.0)),  new GPoint(GMath.mercY(-10.0), GMath.mercX(95.0)), 40, 30)
	], 50, 30, new GPoint(GMath.mercY(-23.24134610238612), GMath.mercX(50.625)), new GPoint(GMath.mercY(2.0), GMath.mercX(73.0)), 50, 30)

console.log(gen)

gen.start()












