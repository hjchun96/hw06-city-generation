#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;

uniform mat3 u_CameraAxes;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

in vec4 vs_Transform1;
in vec4 vs_Transform2;
in vec4 vs_Transform3;
in vec4 vs_Transform4;

out vec3 fs_Pos;
out vec4 fs_Col;
out vec4 fs_Nor;
out vec4 fs_LightVec;


void main()
{
  fs_Col = vs_Col;
  fs_Pos = vs_Pos.xyz;
  fs_Nor = vs_Nor;

  mat4 transforms = mat4(vs_Transform1, vs_Transform2, vs_Transform3, vs_Transform4);
  vec4 modelPos = transforms * vs_Pos;
  vec4 finalPos = vec4(modelPos.x, 0.0, modelPos.z, 1.);
  gl_Position = u_ViewProj * modelPos;
}
