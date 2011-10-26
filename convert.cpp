#include <iostream>
#include <list>
#include <vector>
#include <string>
#include <Magick++.h>

#include <boost/geometry.hpp>
#include <boost/geometry/geometries/point_xy.hpp>
#include <boost/geometry/geometries/polygon.hpp>

#include <boost/geometry/algorithms/area.hpp>
#include <boost/geometry/algorithms/difference.hpp>

using namespace std;
using namespace Magick;

namespace bg = boost::geometry;

typedef bg::model::polygon<bg::model::d2::point_xy<double>, false, true > polygon;
typedef bg::model::d2::point_xy<double> point_xy;

class PosterPiece{
    public:
    string filename;
    int index;
    unsigned int width;
    unsigned int height;
    float angle;
    list< Coordinate > coords;

    polygon orig;
    polygon showing;
};

void subtractPieces( vector<PosterPiece>  & pieces );
polygon maxArea( vector<polygon> & polys );

DrawablePolygon makeDrawable(polygon p, double offsetX, double offsetY);

int main()
{
    vector<PosterPiece> pieces;
    unsigned int width, height;

    string line;
    getline(cin, line);
    int result = sscanf(line.c_str(), "%u %u", &width, &height);

    if( result != 2 ){
        cerr << "Unable to read input file" << endl;
        return 1;
    }

    while( cin.peek() != EOF ){
        string filename;
        getline(cin, filename);

        string line;
        getline(cin, line);

        PosterPiece current;
        current.filename = filename;
        unsigned int x1,y1,x2,y2,x3,y3,x4,y4;
        int result = sscanf(line.c_str(), "%d %u %u %f %u,%u %u,%u %u,%u %u,%u\n", &current.index, &current.width, &current.height, &current.angle, &x1, &y1, &x2, &y2, &x3, &y3, &x4, &y4);
        if( result != 12 ){
            cerr << result << endl;
            fprintf(stderr, "Invalid input file format\n");
            return 1;
        }
        current.coords.push_back( Coordinate(x1, y1) );
        current.coords.push_back( Coordinate(x2, y2) );
        current.coords.push_back( Coordinate(x3, y3) );
        current.coords.push_back( Coordinate(x4, y4) );

        current.orig.outer().push_back( point_xy(x1, y1) );
        current.orig.outer().push_back( point_xy(x2, y2) );
        current.orig.outer().push_back( point_xy(x3, y3) );
        current.orig.outer().push_back( point_xy(x4, y4) );
        current.orig.outer().push_back( point_xy(x1, y1) );

        current.showing.outer().push_back( point_xy(x1, y1) );
        current.showing.outer().push_back( point_xy(x2, y2) );
        current.showing.outer().push_back( point_xy(x3, y3) );
        current.showing.outer().push_back( point_xy(x4, y4) );
        current.showing.outer().push_back( point_xy(x1, y1) );

        pieces.push_back( current );
    }

    subtractPieces( pieces );

    Image orig("poster8.jpg");
    orig.type(TrueColorMatteType);
    orig.sample( Geometry(width, height) );
    orig.page( orig.size() );
    orig.fillColor( "red" );

    vector<PosterPiece>::iterator it;

    int i = 0;
    for(it = pieces.begin(); it != pieces.end(); it++ ){

        DrawablePolygon poly(it->coords);

        list<Drawable> drawMe;
        drawMe.push_back( DrawableStrokeAntialias(true) );
        drawMe.push_back( DrawableStrokeWidth( 3 ));
        drawMe.push_back( DrawableStrokeColor("gray") );
        drawMe.push_back( DrawableFillColor( Color(0, 0, 0, MaxRGB) ) );
        drawMe.push_back(poly);
        orig.draw(drawMe);

        Image current = orig;
        current.backgroundColor( Color(MaxRGB, MaxRGB, MaxRGB, MaxRGB) );
        double minX = width, minY = width, maxX = 0, maxY = 0;

        // find bounding box
        list<Coordinate>::iterator c_it;
        for(c_it = it->coords.begin(); c_it != it->coords.end(); c_it++ ){
            double x = c_it->x();
            double y = c_it->y();
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
        }

        // crop to the bounding box
        current.crop( Geometry(maxX - minX, maxY - minY, minX, minY) );
        // before rotating, fill the showing area with black or something
        current.fillColor( "red" );
        current.draw( makeDrawable( it->showing, minX, minY ) );
        current.write( it->filename );

        /*
        if( i == 1){
            orig.fillColor( "blue" );
            orig.draw( makeDrawable( it->orig, 0, 0) );
        } else {
            orig.fillColor( "red" );
            orig.draw( makeDrawable( it->showing, 0, 0) );
        }
        */
        i++;

        //current.rotate( - (it->angle) );

        /*
        Geometry newSize = current.size();
        Geometry cropGeom(it->width, it->height, (newSize.width() - it->width) / 2, (newSize.height() - it->height) / 2);
        current.page( current.size() );
        current.crop( cropGeom );
        current.write( it->filename  );
        */


    }

    orig.write("fullsize.png");
    return 0;
}

polygon maxArea( vector<polygon> & polys ){

    vector<polygon>::iterator it;
    polygon max;
    for(it = polys.begin(); it != polys.end(); it++ ){
        if( bg::area(*it) > bg::area(max) ){
            max = *it;
        }
    }

    return max;
}

void subtractPieces( vector<PosterPiece>  & pieces ){

    for(unsigned int i=0;i<pieces.size();i++){
        for(unsigned int j=i+1;j<pieces.size();j++){

           vector<polygon> result; 
           bg::difference(pieces[j].showing, pieces[i].orig, result);
           cout << result.size() << endl;

           if( result.size() > 0 ){
               polygon max = maxArea(result);
               cout << max.outer().size() << endl;
               if(max.outer().size() > 1 ){
                   pieces[j].showing = max;
               }
           }
        }
    }
}

DrawablePolygon makeDrawable(polygon p, double offsetX, double offsetY){
    list<point_xy>::iterator it;
    list<Coordinate> coords;

    for(unsigned int i=0;i<p.outer().size();i++){
        double x = p.outer()[i].x() - offsetX;
        double y = p.outer()[i].y() - offsetY;
        coords.push_back( Coordinate(x, y) );
    }

    return DrawablePolygon(coords);
}
