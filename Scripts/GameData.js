/**
 * Created by lurtze1 on 17/03/2016.
 */
var V = function (x, y) { return new SAT.Vector(x, y); };
var P = function (pos, points) { return new SAT.Polygon(pos, points); };
var C = function (pos, r) { return new SAT.Circle(pos, r); };
var B = function (pos, w, h) { return new SAT.Box(pos, w, h); };

$(document).ready(function (){

    var PlayerList = [];
    function Tank(pos, points){
        var Position = pos;
        var points = points;
        var polygon = P(Position, points)
    }


});