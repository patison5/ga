// list of towns
var TOWNS = {
  Moscow: {
    latitue: 55.751244,
    longtitude: 37.618423,
    country: 'RUSSIA'
  },
  NewCastle: {
    latitue: 54.97328,
    longtitude: -1.61396,
    country: 'ENGLAND'
  },
  GreenwoodVillage: {
    latitue: 39.617210,
    longtitude: -104.950813,
    country: 'USA'
  },
  Greenville: {
    latitue: 5.012319,
    longtitude: -9.041973,
    country: 'Liberia'
  },
  Rome: {
    latitue:  41.906204,
    longtitude: 12.507516,
    country: 'Italy'
  },
  Abakan:{
    latitue: 53.720976,
    longtitude: 91.44242300000001,
    country: 'Россия'
  },
  Arkhangelsk:{
    latitue: 64.539304,
    longtitude: 40.518735,
    country: 'Россия'
  },
  Astana:{
    latitue: 71.430564,
    longtitude: 51.128422,
    country: 'Россия'
  },
  Astrakhan:{
    latitue: 46.347869,
    longtitude: 48.033574 ,
    country: 'Россия'
  },
  Barnaul:{
    latitue: 53.356132,
    longtitude: 83.74961999999999,
    country: 'Россия'
  },
  Belgorod:{
    latitue: 50.597467,
    longtitude: 36.588849,
    country: 'Россия'
  },
  Biysk:{
    latitue: 52.541444,
    longtitude: 85.219686 ,
    country: 'Россия'
  },
  Bishkek:{
    latitue: 42.871027,
    longtitude: 74.59452 ,
    country: 'Киргизия'
  },
  Blagoveshchensk:{
    latitue: 50.290658,
    longtitude: 127.527173 ,
    country: 'Россия'
  },
  Bratsk:{
    latitue: 56.151382,
    longtitude: 101.634152 ,
    country: 'Россия'
  },
  Bryansk:{
    latitue: 53.2434,
    longtitude: 34.364198,
    country: 'Россия'
  },
  Vladivostok:{
    latitue: 43.134019,
    longtitude: 131.928379,
    country: 'Россия'
  },
  Vladikavkaz:{
    latitue: 43.024122,
    longtitude: 44.690476,
    country: 'Россия'
  },
  Vladimir:{
    latitue: 56.129042,
    longtitude: 40.40703 ,
    country: 'Россия'
  },
  Volgograd:{
    latitue: 48.707103,
    longtitude: 44.516939 ,
    country: 'Россия'
  },
  Vologda:{
    latitue: 59.220492,
    longtitude: 39.891568,
    country: 'Россия'
  },
  Voronezh:{
    latitue: 51.661535,
    longtitude: 39.200287,
    country: 'Россия'
  },
  Grozny:{
    latitue: 43.317992,
    longtitude: 45.698197 ,
    country: 'Россия'
  },
  Donetsk:{
    latitue: 48.015877,
    longtitude: 37.80285 ,
    country: 'Украина'
  },
  Yekaterinburg:{
    latitue: 56.838002,
    longtitude: 60.597295,
    country: 'Россия'
  },
  Ivanovo:{
    latitue: 57.000348,
    longtitude: 40.973921,
    country: 'Россия'
  },
  Izhevsk:{
    latitue: 56.852775,
    longtitude: 53.211463 ,
    country: 'Россия'
  },
  Irkutsk:{
    latitue: 52.286387,
    longtitude: 104.28066 ,
    country: 'Россия'
  },
  Kazan:{
    latitue: 55.795793,
    longtitude: 49.106585 ,
    country: 'Россия'
  },
  Kaliningrad:{
    latitue: 55.916229,
    longtitude: 37.854467,
    country: 'Россия'
  },
  Kaluga:{
    latitue: 54.507014,
    longtitude: 36.252277,
    country: 'Россия'
  },
  Kemerovo:{
    latitue: 55.359594,
    longtitude: 86.08778100000001,
    country: 'Россия'
  },
  Kiev:{
    latitue: 50.402395,
    longtitude: 30.532690 ,
    country: 'Украина'
  },
  Kirov:{
    latitue: 54.079033,
    longtitude: 34.323163,
    country: 'Россия'
  },
  Korolev:{
    latitue: 55.916229,
    longtitude: 37.854467,
    country: 'Россия'
  },
  Kostroma:{
    latitue: 57.767683,
    longtitude: 40.926418,
    country: 'Россия'
  },
  Krasnodar:{
    latitue: 45.023877,
    longtitude: 38.970157,
    country: 'Россия'
  },
  Krasnoyarsk:{
    latitue: 56.008691,
    longtitude: 92.870529,
    country: 'Россия'
  },
  Kursk:{
    latitue: 51.730361,
    longtitude: 36.192647,
    country: 'Россия'
  },
  Lipetsk:{
    latitue: 52.61022,
    longtitude: 39.594719,
    country: 'Россия'
  },
  Magnitogorsk:{
    latitue: 53.411677,
    longtitude: 58.984415 ,
    country: 'Россия'
  },
  Makhachkala:{
    latitue: 42.984913,
    longtitude: 47.504646,
    country: 'Россия'
  },
  Minsk:{
    latitue: 53.906077,
    longtitude: 27.554914 ,
    country: 'Беларусь'
  },
  Murmansk:{
    latitue: 68.96956299999999,
    longtitude: 33.07454,
    country: 'Россия'
  },
  AustralianCapitalTerritory:{
    latitue: -35.473469,
    longtitude: 149.012375,
    country: 'Australia'
  },
  Argana:{
    latitue: 30.783333,
    longtitude: -9.116667,
    country: 'Morocco'
  }
}
