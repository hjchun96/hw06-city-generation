#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ViewProj;
uniform vec2 u_PlanePos;

uniform float u_ElevationX;
uniform float u_ElevationY;
uniform float u_PopulationX;
uniform float u_PopulationY;

in vec4 vs_Pos;
in vec4 vs_Col;
in vec4 vs_Nor;

out vec3 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_Col;

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


vec2 convert(vec2 pos) {
  float x = (pos.x - 100.0) * (2.0 / -200.0) - 0.845;
  float y = (pos.y + 100.0) * (2.0 / 200.0) - 1.12;
  return vec2(x, y);
}


void main() {
  fs_Pos = vs_Pos.xyz;
  fs_Col = vs_Col;
  fs_Nor = vs_Nor;

  vec2 pos = convert(vec2(-vs_Pos.z, vs_Pos.x));

  // vec4 modelPos = vec4((vs_Pos.x+1.)/2., 0.0, (vs_Pos.z+1.)/2., 1.0);
  vec4 modelPos = vec4(vs_Pos.x, 0.0, vs_Pos.z, 1.0);

  // vec2 height_seed = vec2(3, 3.53);
  // vec2 color_seed = vec2(0.4, 1.0);

  vec2 color_seed = vec2(4.1, 2.6);

  // float elevation = fbm(modelPos.x, modelPos.z, color_seed);
  float elevation = voronoi(pos.x, pos.y, color_seed);

  float height;

  if (elevation > 0.2) { // LAND
    height = -0.1;
  } else {
    height = -0.3;
  }

  modelPos[1] = height;
  modelPos = u_Model * modelPos;
  gl_Position = u_ViewProj * modelPos;
}
