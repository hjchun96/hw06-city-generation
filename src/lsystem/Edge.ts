import { vec2 } from 'gl-matrix';

export default class Edge {

  a: vec2;
  b: vec2;

	constructor(a: vec2, b: vec2) {
		this.a = a;
		this.b = b;
	}

  getTransformation() {

  }
}
