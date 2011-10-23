all: convert

convert: convert.cpp
	g++ -O2 -o convert convert.cpp `Magick++-config --cppflags --cxxflags --ldflags --libs`

clean:
	rm -rf convert
