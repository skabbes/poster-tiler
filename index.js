var canvas, p, img;
var w, h, res;

//var posters = ["poster1.jpg", "poster2.jpg", "poster3.jpg", "poster4.jpg", "poster5.jpg", "poster6.jpg", "poster7.jpg", "poster8.jpg"];
var posters = ["poster8.jpg"];
//var posters = ["http://www.fromparis.com/panoramas_quicktime_vr/louvre_museum_pyramid/louvre_museum_pyramid.jpg"];
//

function testSegment(){
    var poly = new Polygon();
    canvas.width = canvas.width;

    var seg1 = [{x:Math.random() * 300, y:Math.random() * 300}, {x: Math.random() * 300, y:Math.random() * 300}];
    var seg2 = [{x:Math.random() * 300, y:Math.random() * 300}, {x: Math.random() * 300, y:Math.random() * 300}];
    var intersect = poly._segmentIntersect(seg1, seg2);
    var ctx = canvas.getContext("2d");

    ctx.strokeStyle = "blue";
    ctx.lineWidth= 4;

    ctx.beginPath();
    ctx.moveTo( seg1[0].x, seg1[0].y );
    ctx.lineTo( seg1[1].x, seg1[1].y );
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "green";
    ctx.lineWidth= 2;
    ctx.beginPath();
    ctx.moveTo( seg2[0].x, seg2[0].y );
    ctx.lineTo( seg2[1].x, seg2[1].y );
    ctx.closePath();
    ctx.stroke();

    if( intersect ){
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(intersect.x, intersect.y, 10, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }
}

function testSubtract(){
    canvas.width = canvas.width;
    var ctx = canvas.getContext("2d");
    var r1 = new Rect(300, 200);
    var r2 = new Rect(300, 200);
    r2.translate(200, 100);
    r2.rotate(11);

    var p1 = new Polygon( r1.points() );
    var p2 = new Polygon( r2.points() );
    //p1.draw(ctx);
    //p2.draw(ctx);

    var polys = p1.subtract(p2);
    polys.forEach(function(poly){
        poly.draw(ctx);
    });

}

window.onload = function(){
    canvas = document.getElementById("canvas");
    //testSubtract();

    img = new Image();
    img.onload = function(){
        var ratio = img.height / img.width;

        w = 5 * 12;
        h = w * ratio;
        res = 300;

        p = new Poster(w * res, h * res);
        p.setImageSize(6 * res, 4 * res);

        // todo, make this funciton take a callback for generating rectangles
        var numImages = p.addImages(-10, 10);

        var cx = w * res / 2;
        var cy = h * res / 2;
        var script = p.draw(canvas, img, function(i){
            var x = i.centroid().x - cx;
            var y = i.centroid().y - cy;
            return x * x + y * y;
        });

        var link = document.getElementById("scriptLink");
        link.href = "data:text/plain;base64," + Base64.encode(script);
    };

    img.src = posters[ Math.floor(Math.random() * posters.length) ];
};
