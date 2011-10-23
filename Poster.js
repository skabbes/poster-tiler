// create a poster w inches by h inches with resolution res
function Poster(w, h){
    this._width = w;
    this._height = h;
    this._images = [];
}

Poster.prototype.addImages= function(aMin, aMax){
    var yPos = 0;
    var rows = [];
    var height = this._height;

    while( yPos < height){
        var row = this._addRow(yPos, aMin, aMax);
        rows.push(row);

        yPos = row.map(function(image){
            return image.innerBottomBound();
        }).reduce( function(a, b){
            return Math.min(a, b);
        });

        var shouldStop = row.every(function(image){
            return image.bottomBound() > height;
        });

        if( shouldStop ){
            break;
        }
    }

    var lastRow = rows[rows.length - 1];
    var secondLastRow = rows[rows.length - 2];

    lastRow.forEach(function(image){
        image.translate(0, height - image.bottomBound());
    });

    var offset1 = lastRow.map(function(image){
        return image.innerTopBound();
    }).reduce(function(a, b){
        return Math.max(a, b);
    });

    var offset2 = secondLastRow.map(function(image){
        return image.innerBottomBound();
    }).reduce(function(a, b){
        return Math.min(a, b);    
    });

    var among = rows.length - 2;
    var overlap = offset2 - offset1;

    rows.forEach(function(row, index){
        var dy = index === rows.length - 1 ? 0 : (index / among * overlap);
        row.forEach(function(image){
            image.translate(0, -dy);
        });
    });

    this._images = rows;

    var totalImages = rows.reduce(function(total, row){
        return total + row.length;
    }, 0);

    return totalImages;
};

Poster.prototype._addRow= function(yPos, aMin, aMax){
    var xPos = 0;
    var row = [];
    while( xPos < this._width ){

        var r = new Rect(this._iWidth, this._iHeight);
        var range = aMax - aMin;
        r.rotate( (Math.random() * range) + aMin );

        if( xPos === 0 ){
            var offsetX = -r.leftBound();
        } else {
            var offsetX = -r.innerLeftBound();
        }

        if( yPos === 0 ){
            var offsetY = -r.topBound();
        } else {
            var offsetY = -r.innerTopBound();
        }

        r.translate( offsetX, offsetY );
        r.translate( xPos, yPos );

        xPos = r.innerRightBound();
        row.push(r);
    }

    var overlap = row[row.length - 1].rightBound() - this._width;
    var among = row.length - 1;


    row.forEach(function(image, index){
        image.translate( - index / among * overlap, 0);
    });

    return row;
};

Poster.prototype.setImageSize = function(w, h){
    this._iWidth = w;
    this._iHeight = h;
};

Poster.prototype.draw = function(canvas, img, heightCallback){
    //if( !img ) return;
    if( ! heightCallback ){
        heightCallback = function(a, b){
            return Math.random() - .5;
        };
    } 

    var ctx = canvas.getContext("2d");

    var ratio = this._width / this._height;
    var canvasRatio = canvas.width / canvas.height;


    var computedHeight, computedWidth;

    // if canvas is wider than we need
    if( canvasRatio > ratio ){
       computedHeight = canvas.height; 
       computedWidth = this._width * (computedHeight / this._height);
    }
    // width limited
    else {
       computedWidth = canvas.width;
       computedHeight = this._height * (computedWidth / this._width);
    }


    var scale = computedHeight / this._height;

    var sortFn = function(a, b){
        // "higher" images get drawn last
        return heightCallback(b) - heightCallback(a);
    };

    this._images.forEach(function(row, y){
        y += 1;
        y = y + "";
        while( y.length < 2 ){
            y = "0" + y;
        }

        row.forEach(function(image, x){
            x += 1;
            x = x + "";
            while( x.length < 2 ){
                x = "0" + x;
            }
            image.filename = x + "x" + y;
        });
    });

    var images = this._images.reduce(function(images, row){
        return images.concat(row);
    }, []);

    images = images.sort( sortFn );

    /*
    var i = 0;
    var drawMe = setInterval(function(){
        var poly = polygons[i++];
        canvas.width = canvas.width;
        if( i !== 1 ){
            poly.draw(ctx);
        }
        if( i === polygons.length ){
            clearInterval(drawMe);
        }
    }, 1000);
    */

    var i = 0;
    var drawMe = setInterval(function(){
        var image = images[i++];
        image.scale(scale).draw(ctx, img, computedWidth, computedHeight);
        if( i === images.length ){
            clearInterval(drawMe);
        }
    }, 10);

    var drawScale = img.width / this._width;

    var config = Math.round(this._width) + " " + Math.round(this._height) + "\n";
    var reversedImages = images.map(function(x){ return x; }).reverse();
    reversedImages.forEach(function(orig, index){
        var image = orig.scale(drawScale);
        // width, height, angle, drawindex, points
        var line = [index, Math.round(orig._width), Math.round(orig._height), orig._angle];

        orig.points().forEach(function(point){
            line.push( Math.round(point.x) + "," + Math.round(point.y) );
        });

        config += orig.filename + ".jpg\n";
        config += line.join(" ") + "\n";
    });

    //var script = "convert +repage -resize '" + this._width + "' poster8.jpg fullsize.png\n";
    var script = "convert poster8.jpg fullsize.png\n";
    var self = this;

    reversedImages.forEach(function(orig){

        var image = orig.scale(drawScale);
        image.filename = orig.filename;
        var polygonString = image.points().reduce(function(str, point){
            return str + " " + Math.round(point.x) + "," + Math.round(point.y);
        }, "polygon");


        var bounding = image.boundingBox();
        script += "echo extracting portion\n";
        script += "convert +repage -extract '" + Math.ceil(bounding._width) + "x" + Math.ceil(bounding._height) + "+" + Math.round(bounding._dx) + "+" + Math.round(bounding._dy) + "' fullsize.png - | \n";
        script += "convert +repage -rotate '" + (-image._angle).toFixed(4) + "' -background black - - | ";
        script += "convert +repage -gravity center -crop '" + image._width + "x" + image._height + "+0+0' - " + image.filename + ".png\n";
        script += "convert -size " + Math.floor(img.width) + "x" + Math.floor(img.height) + " \\( xc:none -fill white -draw '" + polygonString  +"' -channel a -negate +channel \\) fullsize.png -compose In -composite fullsize.png\n";
    });

    //return script;
    return config;
};
