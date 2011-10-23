function Polygon(points){
    this._points = points || [];
}

Polygon.prototype.addPoint = function(point, after){
    after = after || this._points.length -1;

    this._points.splice(after + 1, 0, point);
};

Polygon.prototype.removePoint = function(index){
    this._points.splice(index, 1);
};

// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
Polygon.prototype.contains = function(point){
    var i, j;
    var c = false;

    var p = this._points;
    for (i = 0, j = p.length-1; i < p.length; j = i++) {
        if ( ((p[i].y > point.y) != (p[j].y > point.y)) && (point.x <= (p[j].x - p[i].x) * (point.y - p[i].y) / (p[j].y - p[i].y) + p[i].x) ){
           c = !c;
        }
    }
    return c;
};

// does this need an edge class?
Polygon.prototype._addPointToEdge = function(edge, point){
    var x1 = edge[0].x;
    var y1 = edge[0].y;
    var d = (point.x - x1) * (point.x - x1) + (point.y - y1) * (point.y - y1);

    for(var i=0;i<edge.length;i++){
        var currPoint = edge[i];
        var currD = (currPoint.x - x1) * (currPoint.x - x1) + (currPoint.y - y1) * (currPoint.y - y1);
        if( currD > d ){
            edge.splice(i, 0, point);
            break;
        }
    }
};

Polygon.prototype.subtract = function(other){
    var myEdges = this._edges();
    var otherEdges = other._edges();

    var self = this;
    // ouch n^2
    myEdges.forEach(function(e1){
        otherEdges.forEach(function(e2){
            var point = self._segmentIntersect(e1, e2);
            if( point ){
                self._addPointToEdge(e1, point);
                self._addPointToEdge(e2, point);
            }
        });
    });


    // normalize the edges to be only of 2 length
    var myNewEdges = [];
    myEdges.forEach(function(points){
        for(var i=1;i<points.length;i++){
            myNewEdges.push( [points[i-1], points[i]] );
        }
    });

    var otherNewEdges = [];
    otherEdges.forEach(function(points){
        for(var i=1;i<points.length;i++){
            otherNewEdges.push( [points[i-1], points[i]] );
        }
    });

    myNewEdges = myNewEdges.filter(function(edge){
        return edge[0].x !== edge[1].x || edge[0].y !== edge[1].y;
    });

    otherNewEdges = otherNewEdges.filter(function(edge){
        return edge[0].x !== edge[1].x || edge[0].y !== edge[1].y;
    });

    // at this point, each polygon is still equivalent, however it has more edges
    // based on where the other polygon intersects it


    // now, we need to keep the exterior edges of this polygon and the interior edges
    // of the other polygon, these edges will define the new polygon(s) as a result
    // of subtracting
    

    var myOutsideEdges = myNewEdges.filter(function(edge){
        var midpoint = {
            x: (edge[0].x  + edge[1].x) / 2,
            y: (edge[0].y  + edge[1].y) / 2
        };

        return ! other.contains(midpoint);
    });

    var otherInsideEdges = otherNewEdges.filter(function(edge){
        var midpoint = {
            x: (edge[0].x  + edge[1].x) / 2,
            y: (edge[0].y  + edge[1].y) / 2
        };

        return self.contains(midpoint);
    });

    // an array of polygons
    var polygons = [];
    var allEdges = myOutsideEdges.concat( otherInsideEdges );

    // each iteration of this while loop cooresponds to one polygon
    while( allEdges.length > 0 ){

        var firstEdge = allEdges.shift();
        var firstPoint = firstEdge[0];
        var findPoint = firstEdge[1];

        var points = [];
        points.push(firstPoint);


        var count = 0;
        // continue finding points until we've looped back to the first point
        while( !( findPoint.x === firstPoint.x && findPoint.y === firstPoint.y) ){
            count++;

            // find the next edge (this could be optimized at the expense of simplicity)
            for(var i=0;i<allEdges.length;i++){
                var cur = allEdges[i];
                if( cur[0].x === findPoint.x && cur[0].y === findPoint.y ){
                    points.push( cur[0] );
                    findPoint = cur[1];
                    // remove this edge, it has already been used
                    allEdges.splice(i, 1);
                    break;
                }
                else if( cur[1].x === findPoint.x && cur[1].y === findPoint.y ){
                    points.push( cur[1] );
                    findPoint = cur[0];
                    // remove this edge, it has already been used
                    allEdges.splice(i, 1);
                    break;
                }
            }

            if(count > 100 ){
                console.log( otherInsideEdges.concat(myOutsideEdges) );
                console.log( allEdges );
                console.log( firstPoint );
                console.log( findPoint );
                console.log( points );
                console.log( "--------------------------------------------------");
                break;
            }

        }

        polygons.push( new Polygon(points) );
    }



    // sort biggest to smallest  by area
    polygons.sort(function(a, b){
        return b.area() - a.area();
    });

    return polygons[0];
};

Polygon.prototype._edges = function(){
    var edges = [];
    var prev = this._points[ this._points.length - 1];
    var curr;
    for(var i=0;i<this._points.length;i++){
        curr = this._points[i];
        edges.push( [prev, curr] );
        prev = curr;
    }
    return edges;
};

// not 100% correct for co-linear segments, but it works for the purpose it is used 
Polygon.prototype._segmentIntersect = function(seg1, seg2){
    // generate the parametric form of the lines containing seg1 and seg2
    // and solve those equations for an intersection point between 2 lines
    // then make sure that that intersection point was a part of the original segment
    
    var x1, x2, x3, x4;
    var y1, y2, y3, y4;
    x1 = seg1[0].x;
    x2 = seg1[seg1.length - 1].x;
    x3 = seg2[0].x;
    x4 = seg2[seg2.length - 1].x;

    y1 = seg1[0].y;
    y2 = seg1[seg1.length - 1].y;
    y3 = seg2[0].y;
    y4 = seg2[seg2.length - 1].y;

    var num1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    var num2 = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

    var denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if( num1 === 0 && num2 === 0 && denom === 0 ){
        // lines are co-linear, they overlay if x3 or x4 is closer to x1 than x2 is
        var d2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        var d3 = (x3 - x1) * (x3 - x1) + (y3 - y1) * (y3 - y1);
        var d4 = (x4 - x1) * (x4 - x1) + (y4 - y1) * (y4 - y1);

        // these co-linear segments overlay, we arbitrarily choose the second intersection point to return
        // TODO change this to return an array of points which they overlap at
        if( d3 <= d2 ){
            throw new Error("Co-linear overlap");
            return {x: x3, y:y3};
        } else if( d4 <= d2 ){
            throw new Error("Co-linear overlap");
            return {x: x4, y:y4};
        } else {
            return null;
        }
    } else if( denom === 0 ){
        // lines are parallel, but not co-linear
        return null;
    }

    var t = num1 / denom;
    var t2 = num2 / denom;

    if( t >= 0 && t <= 1 && t2 >= 0 && t2 <= 1){
        return {x: x1 * (1-t) + x2 * t, y: y1 * (1-t) + y2 * t };
    }

    return null;
};

Polygon.prototype.area = function(){
    var p = this._points;
    var area = 0;
    for(var i=0;i<p.length-1;i++){
        area += ( p[i].x * p[i+1].y - p[i+1].x * p[i].y );
    }
    return area / 2;
};

Polygon.prototype.draw = function(ctx){
    var points = this._points;
    var colors = ["black", "green", "blue", "purple", "orange", "yellow"];

    ctx.save();
    ctx.strokeStyle = "red";
    ctx.fillStyle= colors[ Math.floor( Math.random() * colors.length ) ];
    ctx.lineWidth= 1;

    ctx.beginPath();
    points.forEach(function(point){
        ctx.lineTo( point.x, point.y );
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.restore();
};
