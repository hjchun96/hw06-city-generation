#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform int u_MapType;
uniform float u_ElevationX;
uniform float u_ElevationY;
uniform float u_PopulationX;
uniform float u_PopulationY;

in vec2 fs_Pos;
out vec4 out_Col;

// Voronoi Noise (Modified from http://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm)
// Hash function taken from http://www.iquilezles.org/www/articles/voronoise/voronoise.htm
vec3 hash3( vec2 p ) {
    vec3 q = vec3( dot(p,vec2(127.1,311.7)),
				   				 dot(p,vec2(269.5,183.3)),
				   				 dot(p,vec2(419.2,371.9)));

	return fract(sin(q) * 43758.5453);
}

float voronoi(float x, float y, vec2 seed){

 	vec2 coord = vec2(x, y);
  float r1 = seed.x;
  float r2 = seed.y;

  vec2 p = floor(coord);
  vec2 rem = fract(coord);

	float k = 1.0 + 10.0 * pow(1.0 - r2, 4.0);

	float avg_dist = 0.0;
	float tot_weight = 0.0;

	// Check neighbors
  for (float j = -2.0; j <= 2.0 ;  j = j + 1.0 ) {
  	for (float i = -2.0; i <= 2.0 ; i = i + 1.0) {

      vec2 coord = vec2(i, j);
			vec3 rand_coord = hash3(p + coord) * vec3(r1, r1, 1.0);
			vec2 r = coord - rem + rand_coord.xy;
			float dist = dot(r,r);
			float weight = pow( 1.0 - smoothstep(0.0, 2.03, sqrt(dist)), k );
			avg_dist += rand_coord.z * weight;
			tot_weight += weight;
    }
  }
  return avg_dist/tot_weight;
}

void main() {

  vec3 col_elev, col_dens, col;

  // Calculate Elevation
  float elevation = voronoi(fs_Pos.x, fs_Pos.y, vec2(u_ElevationX, u_ElevationY));

  if (elevation > 0.3) { // LAND
    col_elev = vec3(211./255., 216./255., 171./255.);
  } else {
    col_elev = vec3(72./255., 137./255., 242./255.);
  }

  // Calculate Population Density
  float density = voronoi(fs_Pos.x, fs_Pos.y, vec2(u_PopulationX, u_PopulationY));
  if (density > 0.5) {
    col_dens = vec3(237./255., 68./255., 30./255.);//hslToRgb(80., 80., 100.);
  } else if (density > 0.35) {
    col_dens = vec3(245./255., 247./255., 150./255.); //hslToRgb(80., 80., 100.);
  } else if (density > 0.1) {
    col_dens = vec3(78./255., 141./255., 163./255.);
  } else {
    col_dens = vec3(28./255., 37./255., 102./255.); //hslToRgb(80., 80., 100.);
  }
  if (elevation < 0.3) {
    col_dens = vec3(0.0, 0.0, 0.0);
  }

  // Select Color to Use
  if (u_MapType == 1) { // Overlay
    col = col_dens * 0.5 + col_elev * 0.5;
  } else if (u_MapType == 2) { // Elevation
    col = col_elev;
  } else { // Density
    col = col_dens;
  }
  out_Col = vec4(col, 1.0);
}
