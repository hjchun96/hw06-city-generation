#version 300 es

// varying vec2 vUv;
uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane
                            // but in HW3 you'll have to generate one yourself
uniform float u_ElevationX;
uniform float u_ElevationY;
uniform float u_PopulationX;
uniform float u_PopulationY;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec3 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_Col;

out float fs_Sine;
out vec4 fs_LightVec;  // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader
out vec3 vertexViewPos;


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

void main()
{

  fs_Pos = vs_Pos.xyz;
  float randomized_height;
  float elevation = voronoi(vs_Pos.x, vs_Pos.z, vec2(u_ElevationX, u_ElevationY));

  if (elevation > 0.3) { // LAND
    randomized_height = 1.0;
  } else {
    randomized_height = 0.5;
  }

 	// Introduce Light (taken from HW0)
	// vec4 lightPos = vec4(10, 18, 10, 10);
	mat3 invTranspose = mat3(u_ModelInvTr);
  fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);

  vec4 modelposition = vec4(vs_Pos.x, randomized_height, vs_Pos.z, 1.0);
  modelposition = u_Model * modelposition;
  // fs_LightVec = lightPos - modelposition;

  gl_Position = u_ViewProj * modelposition;
}
