import { vec2 } from 'gl-matrix';

export default class Edge {

  src: vec2;
  dst: vec2;

	constructor(a: vec2, b: vec2) {
		this.src = a;
		this.dst = b;
	}
}
