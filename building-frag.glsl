#version 300 es
precision highp float;

uniform float u_ElevationX;
uniform float u_ElevationY;
uniform float u_PopulationX;
uniform float u_PopulationY;
uniform vec2 u_Dimensions;

uniform vec3 u_Eye, u_Ref, u_Up;
in vec3 fs_Pos;

in vec4 fs_Col;
in vec4 fs_Nor;

out vec4 out_Col;

const float EPSILON = 0.0001;


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

void main()
{
  vec4 fs_LightVec = vec4(5, 10, 10, 1);
  // vec3 lightDirection = normalize(vec3(fs_LightVec.xyz));


  float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));

  // Control ambiance using user input
	float ambientTerm = 1./10.0;
	float lightIntensity = diffuseTerm + ambientTerm;

	// Material base color (before shading)

	// Compute Distance Fog
	float fog = clamp(smoothstep(50.0, 60.0, length(fs_Pos)), 0.0, 1.0);

  vec2 pos = convert(vec2(-fs_Pos.y, fs_Pos.x));

  vec3 col = vec3(0.1);
  if (fs_Col.x == 1.0){
    col = vec3(8./255., 76./255., 109./255.);//hslToRgb(80., 80., 100.);
  } else if (fs_Col.y == 1.0) {//density > 0.001) {
    col = vec3(221./255., 220./255., 190./255.);
  } else {
    col = vec3(174./255., 54./255., 6./255.);
  }

  // // Lighting

  float ambiance =1.0;
  vec3 p = calculateRayDir();
  // vec3 n = estimateNormal(p);

  vec3 rd = normalize(p - u_Eye);
  vec3 ro = u_Eye;
  vec3 K_a = col;
  vec3 K_d = vec3(227./255., 237./255., 247./255.);
  vec3 K_s = vec3(0.2, 0.2, 0.2);
  float shininess = 0.2;
  //
  vec3 obj_color = phongIllumination(K_a, K_d, K_s, shininess, fs_Pos, ro);
  //
  // vec3 light_source = vec3(10.0, 20.0, 2.0);
  // vec3 light_dir = normalize(light_source);
  // vec3 light_color = vec3(244./255., 244./255., 232./255.);//./255., 237./255., 247./255.);
  // // float light = dot(light_dir, n); // Lambertian Reflective Lighting
  // vec3 pntToLight = vec3(light_source - p);
  // float dist = length(pntToLight);
  // float attenuation = 1.0 / dist;
  // vec3 n = fs_Nor.xyz;
  // vec3 spec_color = vec3(227./255., 237./255., 247./255.);
  // // float ssd = softshadow(rp,light_dir, 0.0, 20.0, 2.0);
  // // float ao = ambientOcclusion(rp, light_dir);
  // vec3 specularReflection = vec3(0.0, 0.0, 0.0);
  // if (dot(n, light_dir) > 0.0)
  // {
  //   vec3 halfway = normalize(light_dir + rd);
  //   float w = pow(1.0 - max(0.0, dot(halfway, rd)), 5.0);
  //   specularReflection = attenuation * light_color * mix(spec_color, vec3(1.0), w)  * pow(max(0.0, dot(reflect(-light_dir, n), rd)),shininess);
  // }
  // out_Col =  vec4((obj_color + specularReflection) * ambiance, 1.0);


  out_Col = vec4(obj_color, 1.0);

}
