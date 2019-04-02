#version 300 es
precision highp float;

uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane
// uniform sampler2D tExplosion;

in vec3 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_Col;

// in float fs_Sine;
// in vec4 fs_LightVec;
//

uniform float u_ElevationX;
uniform float u_ElevationY;
uniform float u_PopulationX;
uniform float u_PopulationY;

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

  vec3 col_elev, col;

  // Calculate Elevation
  float elevation = voronoi(fs_Pos.x, fs_Pos.y, vec2(u_ElevationX, u_ElevationY));

  if (elevation > 0.3) { // LAND
    col_elev = vec3(211./255., 216./255., 171./255.);
  } else {
    col_elev = vec3(72./255., 137./255., 242./255.);
  }

  out_Col = vec4(col_elev, 1.0);
}
