function Rect(w, h){
   this._width = w; 
   this._height = h;
   this._angle = 0;

   this._dx = 0;
   this._dy = 0;
}

Rect.prototype.points = function(){
    var rads = Math.PI * (this._angle / 180);

    var points = [
        {x:0, y:0},
        {x:this._width, y: 0},
        {x:this._width, y:this._height},
        {x:0, y:this._height}
    ];

    // rotate and translate
    var cos = Math.cos(rads);
    var sin = Math.sin(rads);
    var self = this;
    return points.map(function(point){
        return {
            x: point.x * cos - point.y * sin + self._dx,
            y: point.x * sin + point.y * cos + self._dy
        };
    });
};

Rect.prototype.leftBound = function(){
    return this.boundingBox().points()[0].x;
};

Rect.prototype.rightBound = function(){
    return this.boundingBox().points()[1].x;
};

Rect.prototype.bottomBound = function(){
    return this.boundingBox().points()[2].y;
};

Rect.prototype.topBound = function(){
    return this.boundingBox().points()[0].y;
};

Rect.prototype.innerLeftBound = function(){
    return this.innerBox().points()[0].x;
};

Rect.prototype.innerRightBound = function(){
    return this.innerBox().points()[1].x;
};

Rect.prototype.innerBottomBound = function(){
    return this.innerBox().points()[2].y;
};

Rect.prototype.innerTopBound = function(){
    return this.innerBox().points()[0].y;
};

Rect.prototype.boundingBox = function(){
    var points = this.points();

    var xs = points.map(function(point){ return point.x;} );
    var ys = points.map(function(point){ return point.y;} );

    var minX = Math.min.apply(this, xs);
    var minY = Math.min.apply(this, ys);
    var maxX = Math.max.apply(this, xs);
    var maxY = Math.max.apply(this, ys);

    var rect = new Rect(maxX - minX, maxY - minY);
    rect.translate(minX, minY);
    return rect;
};

Rect.prototype.centroid = function(){
    var points = this.points();
    var tx = 0;
    var ty = 0;

    points.forEach(function(point){
        tx += point.x;
        ty += point.y;
    });

    tx = tx / points.length;
    ty = ty / points.length;

    return {x: tx, y:ty};
};

Rect.prototype.innerBox = function(){
    var points = this.points();

    if( this._angle === 0 ){
        var r = new Rect(this._width, this._height);
        r.translate(this._dx, this._dy);
        return r;
    }

    var rads = Math.PI * (this._angle / 180);
    if( rads < 0 ) rads = -rads;
    var cos = Math.cos(rads);
    var sin = Math.sin(rads);
    var tan = sin / cos;
    var cot = cos / sin;
    var w = this._width;
    var h = this._height;

    //constraints you just math them out
    var c1 = h / 2;
    var c2 = w * tan;
    var c3 = (w * tan - h * tan * tan) / ( 1 - tan * tan);

    // they are all less-than-or-equal-to constraints
    var h1 = Math.min( c1, c2, c3 );
    var a = h1 / sin;
    var b = (this._height - h1) / cos;

    var inner = new Rect(a, b);
    var percent = h1 / this._height;
    if( this._angle > 0 ){
        var dx = points[0].x + percent * (points[3].x  - points[0].x);
        var dy = points[0].y + percent * (points[3].y  - points[0].y);
        inner.translate(dx, dy);
    } else {
        var dx = points[1].x + percent * (points[2].x  - points[1].x);
        var dy = points[1].y + percent * (points[2].y  - points[1].y);
        inner.translate(dx, dy);
        inner.translate(-a, 0);
    }
    return inner;
};

Rect.prototype.scale = function(scale){
    var r = new Rect(this._width * scale, this._height * scale); 
    r.translate(this._dx * scale, this._dy * scale);
    r.rotate( this._angle );
    return r;
};

Rect.prototype.draw = function(ctx, img, w, h){
    var points = this.points();
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.lineWidth= 2;

    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "black";


    ctx.beginPath();
    points.forEach(function(point){
        ctx.lineTo( point.x, point.y );
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.clip();

    if( img ){
        ctx.drawImage(img, 0, 0, w, h);
    }

    ctx.restore();
};

Rect.prototype.drawFrame = function(ctx){
    var points = this.points();
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.lineWidth= 2;

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "black";


    ctx.beginPath();
    points.forEach(function(point){
        ctx.lineTo( point.x, point.y );
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.restore();
};

Rect.prototype.translate = function(dx, dy){
    this._dx += dx;
    this._dy += dy;
};

Rect.prototype.rotate = function(deg){
    this._angle += deg;
};
