var canvas, p, img;
var w, h, res;

function cancelEvent(e){
    e.stopPropagation();
    e.preventDefault();
}

function drop(e){
    console.log("drop");
    $("#canvas").removeClass("drag");
    e.stopPropagation();
    e.preventDefault();
    var dt = e.dataTransfer;
    console.log(dt);
    handleFiles( dt.files );
}

function dragEnter(e){
    console.log("dragEnter");
    e.stopPropagation();
    e.preventDefault();
    $("#canvas").addClass("drag");
}

function dragLeave(e){
    console.log("dragLeave");
    e.stopPropagation();
    e.preventDefault();
    $("#canvas").removeClass("drag");
}

$(document).ready(function(){
    canvas = document.getElementById("canvas");


    canvas.addEventListener("dragenter", dragEnter, false);
    canvas.addEventListener("dragleave", dragLeave, false);
    canvas.addEventListener("dragover", cancelEvent, false);

    canvas.addEventListener("drop", drop, false);
});




function handleFiles(files) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var imageType = /image.*/;
    
    if (!file.type.match(imageType)) {
      continue;
    }
    
    var img = new Image();
    
    var reader = new FileReader();
    reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
    reader.readAsDataURL(file);

    img.onload = function(){
        canvas.width = canvas.width;
        var ratio = img.height / img.width;
        canvas.height = canvas.width * ratio;

        var _width = $("#width").val();
        if( _width === parseInt(_width, 10) + "" ){
            w = parseInt(_width);
        } else {
            alert("no width specified, assuming 60 inches");
            w = 5 * 12;
        }

        h = w * ratio;
        res = 300;

        p = new Poster(w * res, h * res);
        p.setImage( img );

        /*
        var numImages = p.addImages(function(xPos, yPos){
            var rand = Math.floor(Math.random() * 3);
            var r;

            xPos += 2 * res;
            yPos += 3 * res;

            if( rand === 0 ){
                r = new Rect(6 * res, 4 * res);
            } else if( rand === 1){
                r = new Rect(5 * res, 5 * res);
            } else if (rand === 2){
                r = new Rect(7 * res, 5 * res);
            }

            // j varies between -1 and 1
            var j = (xPos - w*res / 2) / (w*res/2);
            if( yPos > (h*res / 2) ){
                j = -j;
            }

            r.rotate( j * 20);
            return r;
        });
        */

        var factory = new RectFactory();

        var sizes = [
            {width: 6*res, height: 4*res},
            {width: 5.3*res, height: 4*res},
            {width: 5*res, height: 3.25*res},
            {width: 5*res, height: 5*res},
            {width: 7*res, height: 5*res},
            {width: 6.5*res, height: 5*res}
        ];

        var flags = [
            $("#4x6").is(":checked"),
            $("#4x5_3").is(":checked"),
            $("#3_25x5").is(":checked"),
            $("#5x5").is(":checked"),
            $("#5x7").is(":checked"),
            $("#5x6_5").is(":checked")
        ];

        var selectedSizes = sizes.filter(function(size, index){
            return flags[index];
        });

        factory.setSizes(selectedSizes);
        var numImages = p.addImages( factory.randomAngle(-10, 10) );

        var cx = w * res / 2;
        var cy = h * res / 2;

        var highPoints = [
            {x: cx, y:cy},
            {x: cx/2, y:cy/2},
            {x: cx/2, y:3*cy/2},
            {x: cx*3/2, y:cy}
        ];

        console.log(highPoints);

        var script = p.draw(canvas, function(i){
            var p = i.centroid();

            var dist = function(a, b){
                return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
            };

            var closest = highPoints.reduce(function(closest, candidate){
                if( dist(p, candidate) <= dist(p, closest) ){
                    return candidate;
                }
                return closest;
            }, highPoints[0]);

            var d = dist(p, closest);
            return d;
        });

        var link = document.getElementById("scriptLink");
        link.href = "data:text/plain;," + escape(script);
    };

    break;
  }
}
