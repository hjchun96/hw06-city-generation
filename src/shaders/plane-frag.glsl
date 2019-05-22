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

in vec3 fs_Pos;
in vec4 fs_Nor;
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


float random1( vec2 p , vec2 seed) {
  return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

float random1( vec3 p , vec3 seed) {
  return fract(sin(dot(p + seed, vec3(987.654, 123.456, 531.975))) * 85734.3545);
}

vec2 random2( vec2 p , vec2 seed) {
  return fract(sin(vec2(dot(p + seed, vec2(311.7, 127.1)), dot(p + seed, vec2(269.5, 183.3)))) * 85734.3545);
}


// Fractal Brownian Motion (referenced lecture code)

float interpNoise2D( float x, float y, vec2 seed) {

	float intX = floor(x);
	float fractX = fract(x);
	float intY = floor(y);
	float fractY = fract(y);

	float v1 = random1(vec2(intX, intY), seed);
	float v2 = random1(vec2(intX + 1.0, intY), seed);
	float v3 = random1(vec2(intX, intY + 1.0), seed);
	float v4 = random1(vec2(intX + 1.0, intY + 1.0), seed);

	float i1 = mix(v1, v2, fractX);
	float i2 = mix(v3, v4, fractY);
	return mix(i1, i2, fractY);

}

float fbm( float x, float y, vec2 seed) {

	float total = 0.0;
	float persistance = 0.5;
	float octaves = 8.0;

	for (float i = 0.0; i < octaves; i = i + 1.0) {
		float freq = pow(2.0, i);
		float amp = pow(persistance, i);
		total += interpNoise2D(x * freq, y * freq, seed) * amp;
	}
	return total;
}

// ex (3, -5) -> (5, 3)
// vec2 rotate_point(float cx, float cy, float angle, vec2 ogpnt) {
//   float s = sin(angle);
//   float c = cos(angle);
//   vec2 p;
//   // translate point back to origin:
//   p.x  = ogpnt.x - cx;
//   p.y  = ogpnt.y - cy;
//
//   // rotate point
//   float xnew = p.x * c - p.y * s;
//   float ynew = p.x * s + p.y * c;
//
//   // translate point back:
//   p.x = xnew + cx;
//   p.y = ynew + cy;
//   return p;
// }
//

vec2 convert(vec2 pos) {
  float x = (pos.x - 100.0) * (2.0 / -200.0) - 0.845;
  float y = (pos.y + 100.0) * (2.0 / 200.0) - 1.12;
  return vec2(x, y);
}
vec3 calculateRayDir() {

  vec3 forward = u_Ref - u_Eye;
	vec3 right = normalize(cross(u_Up, forward));
	vec3 up = normalize(cross(forward, right));

	float len = length(u_Ref - u_Eye);
	forward = normalize(forward);
	float aspect = u_Dimensions.x / u_Dimensions.y;

  float fovy = 90.0;
	float alpha = radians(fovy/2.0);
	vec3 V = up * len * tan(alpha);
	vec3 H = right * len * aspect * tan(alpha);

	float sx = 1.0 - (2.0 * gl_FragCoord.x/u_Dimensions.x);
	float sy = (2.0 * gl_FragCoord.y/u_Dimensions.y) - 1.0;
	vec3 p = u_Ref + sx * H + sy * V;
	return p;
}


vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    vec3 N = fs_Nor.xyz;//estimateNormal(p);
    vec3 L = normalize(lightPos - p);
    vec3 V = normalize(eye - p);
    vec3 R = normalize(reflect(-L, N));

    float dotLN = dot(L, N);
    float dotRV = dot(R, V);

    if (dotLN < 0.0) {
        // Light not visible from this point on the surface
        return vec3(0.0, 0.0, 0.0);
    }

    if (dotRV < 0.0) {
        // Light reflection in opposite direction as viewer, apply only diffuse
        // component
        return lightIntensity * (k_d * dotLN);
    }
    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
}

vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.6 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;

    vec3 light1Pos = vec3(10.0, 20.0, 2.0);
    vec3 light1Intensity = vec3(0.1, 0.1, 0.1);

    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light1Pos,
                                  light1Intensity);

    vec3 light2Pos = vec3(7.0,
                          20.0,
                          20.0);
    vec3 light2Intensity = vec3(0.1, 0.1, 0.1);

    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light2Pos,
                                  light2Intensity);

    return color;
}

void main() {


  vec3 col_elev, col_dens, col;

  // vec2 rotated = rota
  // Calculate Elevation
  vec2 pos = convert(vec2(-fs_Pos.z, fs_Pos.x));

  // vec2 color_seed = vec2(1.7, 2.0); -> good for fbm

  vec2 color_seed = vec2(4.1, 2.6);

  float elevation = voronoi(pos.x, pos.y, color_seed);
  // float elevation = voronoi(pos.y, -pos.x, color_seed);


  if (elevation > 0.2) { // LAND
    //171, 181, 198
    // col_elev = vec3(211./255., 216./255., 171./255.);
    // 149, 159, 175)
    col_elev = vec3(149./255., 159./255., 175./255.);

  } else {
    col_elev = vec3(72./255., 137./255., 242./255.);
  }

  float ambiance =1.0;
  vec3 p = calculateRayDir();
  // vec3 n = estimateNormal(p);

  vec3 rd = normalize(p - u_Eye);
  vec3 ro = u_Eye;
  vec3 K_a = col_elev;
  vec3 K_d = vec3(227./255., 237./255., 247./255.);
  vec3 K_s = vec3(0.2, 0.2, 0.2);
  float shininess = 0.2;
  //
  vec3 obj_color = phongIllumination(K_a, K_d, K_s, shininess, fs_Pos, ro);

  out_Col = vec4(obj_color, 1.0);
}
