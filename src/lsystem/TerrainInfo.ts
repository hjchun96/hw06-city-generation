import { vec2, vec3, mat4, quat } from 'gl-matrix';

export default class TerrainInfo {

  population_seed: vec2;
  elevation_seed: vec2;

  constructor(population_seed: vec2, elevation_seed: vec2) {
    this.population_seed = population_seed;
    this.elevation_seed = elevation_seed;
  }

  // Helper Functions
  // For Population check
  fract(value: number) : number {
    return (value - Math.floor(value));
  }

  hash3(p: vec2) : vec3 {
      let q = vec3.fromValues( vec2.dot(p, vec2.fromValues(127.1,311.7)),
                               vec2.dot(p, vec2.fromValues(269.5,183.3)),
                               vec2.dot(p, vec2.fromValues(419.2,371.9)));
      let c = 43758.5453;
      let val: vec3 = vec3.fromValues(Math.sin(q[0]) * c, Math.sin(q[1]) *c, Math.sin(q[2]) *c);
      return vec3.fromValues(this.fract(val[0]), this.fract(val[1]), this.fract(val[2]));
  }

  smoothstep (min: number, max:number, value: number) : number {
    var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return x*x*(3 - 2*x);
  };

  voronoi(x: number, y: number, seed: vec2): number {
    let coord = vec2.fromValues(x, y);
    let r1 = seed[0];
    let r2 = seed[1];

    let p = vec2.fromValues(Math.floor(x), Math.floor(y));
    let rem: vec2 = vec2.fromValues(this.fract(x), this.fract(y));

    let k = 1.0 + 10.0 * Math.pow(1.0 - r2, 4.0);

    let avg_dist = 0.0;
    let tot_weight = 0.0;

    // Check neighbors
    for (let j = -2.0; j <= 2.0 ;  j = j + 1.0 ) {
      for (let i = -2.0; i <= 2.0 ; i = i + 1.0) {
        let coord: vec2 = vec2.fromValues(i, j);
        let sum :vec2 = vec2.create();
        vec2.add(sum, p, coord);
        let rand_coord: vec3 = vec3.create();
        vec3.multiply(rand_coord, this.hash3(sum), vec3.fromValues(r1, r1, 1.0));
        // let r = coord - rem + vec2.fromValues(rand_coord[0], rand_coord[1]);
        let r :vec2 = vec2.create();
        vec2.subtract(r, coord, rem);
        vec2.add(r, r, vec2.fromValues(rand_coord[0], rand_coord[1]));
        let dist = vec2.dot(r,r);
        let weight = Math.pow( 1.0 - this.smoothstep(0.0, 2.03, Math.sqrt(dist)), k );
        avg_dist += rand_coord[2] * weight;
        tot_weight += weight;
      }
    }
    return avg_dist/tot_weight;
  }

 isLand(x: number, y: number) : boolean {
   return this.voronoi(x, y, this.elevation_seed) > 0.2;
 }

 getPopulation(x: number, y: number) : number {
   return this.voronoi(x, y, this.population_seed);
 }

 getElevation(x: number, y: number) : number {
   return this.voronoi(x, y, this.elevation_seed);
 }
}
