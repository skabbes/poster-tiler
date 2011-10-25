function RectFactory(){
    this._sizes = [];
}

// array of {width: w, height: h}
RectFactory.prototype.setSizes = function(sizes){
    this._sizes = sizes;
};

RectFactory.prototype.randomAngle = function(minAngle, maxAngle){
    var sizes = this._sizes.map(function(x){ return x; });

    return function(xPos, yPos){
        var i = Math.floor( Math.random() * sizes.length );
        var angle = Math.random() * (maxAngle - minAngle) + minAngle;
        var r = new Rect( sizes[i].width, sizes[i].height );
        r.rotate( angle );
        return r;
    };
};
