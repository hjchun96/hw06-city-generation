import {vec2, vec3, mat4, quat, vec4} from 'gl-matrix';
//A Turtle class to represent the current drawing state of your L-System.
// It should at least keep track of its current position, current orientation,
// and recursion depth (how many [ characters have been found while drawing before ]s)
export default class Turtle {

  position: vec3;
  orientation: quat;
  scale: vec3;
  step: number;


  constructor(pos: vec3, orient: quat, scale: vec3, step: number) {
    this.position = pos;
    this.orientation = orient;
    this.scale = scale; //vec3.fromValues(1.0, 10.0, 1.0);
    this.step = step;
  }

  rotate(x: number, y:number, z:number): void {
    let tmp = quat.create();
    quat.fromEuler(tmp, x, y, z);
    quat.multiply(this.orientation, this.orientation, tmp);
  }

  adjust(angle: number) {
    let R: mat4 = mat4.create();
    mat4.fromQuat(R, this.orientation);
    let forward :vec3 = vec3.create();
    let up = vec3.fromValues(0, 1, 0);
    vec3.transformMat4(forward, up, R);
    let prevPos:vec3 = vec3.create();
    vec3.copy(prevPos,this.position);
    // let scale = vec3.fromValues(0.01, 0.02, 0.01);
    // vec3.multiply(forward, forward, scale);
    // vec3.scaleAndAdd(this.position,this.position,forward, Math.sin(angle)* this.step/4.);
    vec3.add(this.position, this.position, vec3.fromValues( 0.,Math.sin(angle) * this.step/4. ,0.));
  }


  moveForward(): void{
    let R: mat4 = mat4.create();
    mat4.fromQuat(R, this.orientation);
    let forward :vec3 = vec3.create();
    let up = vec3.fromValues(0, 1, 0);
    vec3.transformMat4(forward, up, R);
    let prevPos:vec3 = vec3.create();
    vec3.copy(prevPos,this.position);
    // let scale = vec3.fromValues(0.01, 0.02, 0.01);
    // vec3.multiply(forward, forward, scale);
    vec3.scaleAndAdd(this.position,this.position,forward, this.step);
  }

  getTransformation(): mat4 {// mat = T * R * S

    let T = mat4.create();
    let R = mat4.create();
    let S = mat4.create();
    let trans = mat4.create();

    mat4.fromTranslation(T, this.position);
    mat4.fromQuat(R, this.orientation);
    mat4.fromScaling(S, this.scale);
    mat4.multiply(trans,T, R);
    mat4.multiply(trans, trans, S);
    return trans;
    }
}
