
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

	getX (line, y) {
		var x = (y - line.p1.y) / (line.p2.y - line.p1.y) * (line.p2.x - line.p1.x) + line.p1.x
		return x
	},

	pointBelongToSegment (A, B, C) {
		if (((A.x <= C.x) && (C.x <= B.x)) || ((B.x <= C.x) && (C.x <= A.x))) {
			return true
		}
		return false
	},

	hypotenusus(start, finish) {
		let dx = finish.x - start.x
		let dy = finish.y - start.y
		return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
	},

	nextPoint(start, finish, speed, t){
		let delta = this.hypotenusus(start, finish)
		let time = delta / speed
		let vx = (finish.x - start.x) / time
		let vy = (finish.y - start.y) / time
		let x = start.x + vx * parseFloat(t)
		let y = start.y + vy * parseFloat(t)
		return new GPoint(y, x)
	},
}

var Line = function (p1, p2) {
	this.p1 = p1;
	this.p2 = p2;
	this.a = p1.y - p2.y;
	this.b = p2.x - p1.x;
	this.c = -(p1.x * p2.y - p2.x * p1.y);
}

var Intersection = function (line1, line2)  {
	let d = line1.a * line2.b - line1.b * line2.a
	let dx = line1.c * line2.b - line1.b * line2.c
	let dy = line1.a * line2.c - line1.c * line2.a
	if (d != 0) {
		return new GPoint(dy / d, dx / d)
	}
	return undefined
}

class GPoint {
	constructor(lat, lon) {
		this.x = lon;
		this.y = lat;
	}
}


class GRoad {
	constructor(arrayOfPoints) {
		this.wayDots  = arrayOfPoints;
		this.hasCollision = false;
	}

	fullDistance() {
		var distance = 0.0
		for (var i = 0; i < this.wayDots.length - 1; i++) {
			let point1 = this.wayDots[i]
			let point2 = this.wayDots[i+1]
			distance += GMath.hypotenusus(point1, point2)
		}
		return distance
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

		for (var i = 0; i < 10; i++) {
			var newWay = new GRoad([
				selfStart,
				new GPoint(GMath.randomInteger(selfStart.y, selfFinish.y), GMath.randomInteger(selfStart.x, selfFinish.x)),
				new GPoint(GMath.randomInteger(selfStart.y, selfFinish.y), GMath.randomInteger(selfStart.x, selfFinish.x)),
				new GPoint(GMath.randomInteger(selfStart.y, selfFinish.y), GMath.randomInteger(selfStart.x, selfFinish.x)),
				new GPoint(GMath.randomInteger(selfStart.y, selfFinish.y), GMath.randomInteger(selfStart.x, selfFinish.x)),
				// new GPoint(6, 3),
				// new GPoint(3, 6),
				// new GPoint(2, 9),
				// new GPoint(7, 12),
				selfFinish
			])

			this.childrenRoads.push(newWay)
		}
	};

	start() {
		for (var start = 0; start < this.amountOfCircles; start++) {
			this.selection();
			this.crossing();
			this.mutating();
		}

		console.log("BEST: ", this.childrenRoads[0])
	}

	selection() {
		// console.log("Кол-во маршрутов: ", this.childrenRoads.length)
		for (var i = 0; i < this.childrenRoads.length; i++) {
			let road = this.childrenRoads[i];
			let wayDots = road.wayDots;

			// console.log(road)

			for (var shipId in this.concuredShips) {
				var probableCollision = []

				for (var j = 0; j < wayDots.length - 1; j++) {
					var p1 = new GPoint(wayDots[j].y, wayDots[j].x);		//сделано для копирования в новый объект
					var p2 = new GPoint(wayDots[j+1].y, wayDots[j+1].x); 	//сделано для копирования в новый объект

					var inter = new Intersection(new Line(p1, p2), new Line(this.concuredShips[shipId].start, this.concuredShips[shipId].finish))
					if (inter == undefined) continue;
					var x = GMath.getX(new Line(p1, p2), inter.y)

					x = parseFloat(x.toFixed(5));
					inter.x = parseFloat(inter.x.toFixed(5));
					inter.y = parseFloat(inter.y.toFixed(5));

					p1.x = parseFloat(p1.x.toFixed(5))
					p1.y = parseFloat(p1.y.toFixed(5))
					p2.x = parseFloat(p2.x.toFixed(5))
					p2.y = parseFloat(p2.y.toFixed(5))

					if ((x == inter.x) && (GMath.pointBelongToSegment(p1, p2, new GPoint(inter.y, x)))) {
						probableCollision.push(new Line(wayDots[j], wayDots[j+1]))
					}
				}

				// console.log("size", probableCollision.length)
				var time = 0;
				for (var j = 0; j < wayDots.length - 1; j++) {
					var p1 = new GPoint(wayDots[j].y, wayDots[j].x);		//сделано для копирования в новый объект
					var p2 = new GPoint(wayDots[j+1].y, wayDots[j+1].x); 	//сделано для копирования в новый объект

					var contains = false;
					for (var pc in probableCollision) {
						let pc1 = probableCollision[pc].p1;
						let pc2 = probableCollision[pc].p2;

						if ((pc1.x == p1.x) && (pc1.y == p1.y) && (pc2.x == p2.x) && (pc2.y == p2.y)) {
							contains = true;
							break;
						}
					}

					if (contains) {
						var inter = new Intersection(new Line(p1, p2), new Line(this.concuredShips[shipId].start, this.concuredShips[shipId].finish))
						if (inter == undefined) continue;

						time += GMath.hypotenusus(p1, inter) / this.selfSpeed
						let ship = this.concuredShips[shipId];


						let concuredShipPosition = GMath.nextPoint(ship.start, ship.finish, ship.speed, time)
						let delta = GMath.hypotenusus(inter, concuredShipPosition)
						let maxRadius = 20
						if (delta <= maxRadius) {
							this.childrenRoads[i].hasCollision = true;
						}

					} else {
						time += GMath.hypotenusus(p1, inter) / this.selfSpeed;
					}
				}
			}
			// console.log(road)
		}

		// console.log("s")

		var withCollision = this.childrenRoads.filter(road => road.hasCollision);
		var withOutCollision = this.childrenRoads.filter(road => !road.hasCollision);

		var sortedWithCollisions = withCollision.sort(function (a,b) {
			return a.fullDistance() < b.fullDistance()
		});

		var sortedWithOutCollisions = withOutCollision.sort(function (a,b) {
			return a.fullDistance() > b.fullDistance()
		})

		sortedWithOutCollisions = sortedWithOutCollisions.concat(sortedWithCollisions);

		this.childrenRoads = sortedWithOutCollisions;
		this.childrenRoads = this.childrenRoads.slice(0, this.amountOfPopulations);

		// console.log("withCollision", withCollision)
		// console.log("withOutCollision", withOutCollision)
		// console.log("sortedWithCollisions", sortedWithCollisions)
		// console.log("sortedWithOutCollisions", sortedWithOutCollisions)
	}

	crossing() {
		for (var i = 0; i < GMath.div(this.childrenRoads.length, 2); i++) {
			var roadX = this.childrenRoads[i]
			var roadY = this.childrenRoads[i+1]
			var wayDots = []

			if (roadX.fullDistance() < roadY.fullDistance()) {
				wayDots = wayDots.concat(roadX.wayDots)
			} else {
				wayDots = wayDots.concat(roadY.wayDots)
			}

			this.childrenRoads.push(new GRoad(wayDots))
		}
	}

	mutating() {

	}
}


var gen = new Genetic(150, 250, [
		new GShip(new GPoint(GMath.mercY(-15.0), GMath.mercX(53.0)), new GPoint(GMath.mercY(-22.0), GMath.mercX(90.0)), 40, 20),
		new GShip(new GPoint(GMath.mercY(-5.0), GMath.mercX(50.0)),  new GPoint(GMath.mercY(-10.0), GMath.mercX(95.0)), 40, 30)
	], 50, 30, new GPoint(GMath.mercY(-23.24134610238612), GMath.mercX(50.625)), new GPoint(GMath.mercY(2.0), GMath.mercX(73.0)), 50, 30)

// var gen = new Genetic(50, 10, [
// 		new GShip(new GPoint(4,13), new GPoint(4,0), 40, 20),
// 		// new GShip(new GPoint(GMath.mercY(-5.0), GMath.mercX(50.0)),  new GPoint(GMath.mercY(-10.0), GMath.mercX(95.0)), 40, 30)
// 	], 50, 30, new GPoint(2,1), new GPoint(6,15), 50, 30)

console.log(gen)

gen.start()






// {x: 3710.896387667001, y: 3280.97546470558}
// 1: GPoint {x: 3980, y: 3273}
// 2: GPoint {x: 3845, y: 3257}
// 3: GPoint {x: 4070, y: 2870}
// 4: GPoint {x: 4047, y: 3020}
// 5: GPoint {x: 4070.9237336791384, y: 2864.12162315678}





