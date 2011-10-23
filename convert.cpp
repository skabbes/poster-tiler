#include <iostream>
#include <list>
#include <string>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class PosterPiece{
    public:
    string filename;
    int index;
    unsigned int width;
    unsigned int height;
    float angle;
    list< Coordinate > coords;
};


int main()
{
    list<PosterPiece> pieces;
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
        pieces.push_back( current );
    }


    Image orig("poster8.jpg");
    orig.type(TrueColorMatteType);
    orig.sample( Geometry(width, height) );
    orig.page( orig.size() );

    list<PosterPiece>::iterator it;

    for(it = pieces.begin(); it != pieces.end(); it++ ){

        DrawablePolygon poly(it->coords);
        Image current = orig;
        current.backgroundColor( Color(MaxRGB, MaxRGB, MaxRGB, MaxRGB) );
        double minX = width, minY = width, maxX = 0, maxY = 0;

        list<Coordinate>::iterator c_it;
        for(c_it = it->coords.begin(); c_it != it->coords.end(); c_it++ ){
            double x = c_it->x();
            double y = c_it->y();
            minX = x < minX ? x : minX;
            minY = y < minY ? y : minY;
            maxX = x > maxX ? x : maxX;
            maxY = y > maxY ? y : maxY;
        }

        current.crop( Geometry(maxX - minX, maxY - minY, minX, minY) );
        current.rotate( - (it->angle) );
        current.write("rotated.png");

        Image mask;
        mask.size( current.size() );
        mask.type(TrueColorMatteType);
        mask.backgroundColor( Color(MaxRGB, MaxRGB, MaxRGB, MaxRGB) );
        mask.fillColor( "black" );
        mask.erase();

        list<Coordinate> newCoords;
        for(c_it = it->coords.begin(); c_it != it->coords.end(); c_it++ ){
            double x = c_it->x();
            double y = c_it->y();
            newCoords.push_back( Coordinate(x - minX, y - minY) );
        }

        DrawablePolygon newPoly(newCoords);
        mask.draw(newPoly);
        mask.write("mask.png");

        /*
        mask.channel( MatteChannel );
        mask.backgroundColor( Color(MaxRGB, MaxRGB, MaxRGB, MaxRGB) );
        mask.type(TrueColorMatteType);
        mask.fx("r", MatteChannel);
        mask.write("mask1.png");
        */

        Geometry newSize = current.size();
        Geometry cropGeom(it->width, it->height, (newSize.width() - it->width) / 2, (newSize.height() - it->height) / 2);
        current.page( current.size() );
        current.crop( cropGeom );
        current.write( it->filename  );

        mask.composite(orig, Geometry(maxX - minX, maxY - minY, minX, minY), OutCompositeOp);
        mask.write("mask1.png");

        list<Drawable> drawMe;
        drawMe.push_back( DrawableStrokeAntialias(true) );
        drawMe.push_back( DrawableStrokeWidth( 3 ));
        drawMe.push_back( DrawableStrokeColor("gray") );
        drawMe.push_back( DrawableFillColor( Color(0, 0, 0, MaxRGB) ) );
        drawMe.push_back(poly);
        orig.draw(drawMe);

        orig.write("fullsize.png");
        break;
    }
    return 0;
}

