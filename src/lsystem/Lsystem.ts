import { vec2, vec3, mat4, quat } from 'gl-matrix';
import Turtle from './Turtle';
import Edge from './Edge';

// A stack of Turtles to represent your Turtle history. Push a copy of your current
// Turtle onto this when you reach a [ while drawing, and pop the top Turtle from the
// stack and make it your current Turtle when you encounter a ]. Note that in TypeScript,
// push() and pop() operations can be done on regular arrays.

export default class Lsystem {

    turtle: Turtle;
    turtle_stack: Turtle[];
    num_iterations: number;
    highway_trans_mat: mat4[];
    road_trans_mat: mat4[];
    population_seed: vec2;
    elevation_seed: vec2;
    threshold: number;

    edges: Edge[];
    intersections: vec2[];

    constructor(num_iterations: number, population_seed: vec2, elevation_seed: vec2) {
      this.num_iterations = num_iterations;
      this.highway_trans_mat =[];
      this.road_trans_mat = [];
      this.turtle_stack = [];
      this.intersections = [];
      this.edges = [];
      this.elevation_seed = elevation_seed;
      this.population_seed = population_seed;
      let init = quat.create();
      quat.fromEuler(init, 0, 0,0);
      this.turtle = new Turtle(vec3.fromValues(0.5, 0.0, 0.0), init, vec3.fromValues(2, 7.0, 1.0), 0.1);
      this.generateHighway();
      this.generateRoad();
   }
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

   copy(turtle: Turtle): Turtle {
     let newPos: vec3 = vec3.create();
     vec3.copy(newPos, turtle.position);

     let newScale: vec3 = vec3.create();
     vec3.copy(newScale, turtle.scale);

     let newOrient: quat = quat.create();
     quat.copy(newOrient, turtle.orientation);

     // let newDepth = turtle.depth;
     let dup = new Turtle(newPos, newOrient, newScale, turtle.step);
     // dup.depth = newDepth;
     dup.scale = newScale;
     return dup;
   }

   drawBranch(): void {
     let curr_trans = this.turtle.getTransformation();
     this.highway_trans_mat.push(curr_trans);
     this.turtle.moveForward();
   }


   pushState(): void {
     let copy = this.copy(this.turtle);
     this.turtle_stack.push(copy);
   }

   popState(): void{
     let popped = this.turtle_stack.pop();
     vec3.copy(this.turtle.position, popped.position);
     quat.copy(this.turtle.orientation, popped.orientation);
     vec3.copy(this.turtle.scale,popped.scale);
     // this.turtle.depth = popped.depth;
   }

   getEdge(turtle: Turtle): Edge {
     let a = vec2.fromValues(turtle.position[0], turtle.position[1]);
     let R: mat4 = mat4.create();
     mat4.fromQuat(R, turtle.orientation);
     let forward :vec3 = vec3.create();
     let up = vec3.fromValues(0, 1, 0);
     vec3.transformMat4(forward, up, R);
     let prevPos :vec3 = vec3.create();
     let newPos  = vec3.create();
     vec3.copy(prevPos,turtle.position);
     vec3.scaleAndAdd(newPos,turtle.position,forward, -turtle.step);
     let b = vec2.fromValues(newPos[0], newPos[1]);
     return (new Edge(b, a));
   }

   checkForIntersections(t: Turtle) : vec3 {
      let radius = 0.1;
      for (let i = 0; i < this.intersections.length; i++) {
          let ints = this.intersections[i];
          let dist = vec2.distance(ints, vec2.fromValues(t.position[0], t.position[1]));
          if (dist <= radius) {
            console.log("okay inters")
              return vec3.fromValues(ints[0], ints[1] ,0);
          }
      }
      return undefined;
    }

   checkForPotCrossing(t: Turtle) : vec3 { // Should also add to new intersections
     let curr_edge : Edge;

     for (let i = 0; i < this.edges.length; i++) {
       curr_edge = this.edges[i];
       let newPos = vec3.create();

       let R: mat4 = mat4.create();
       mat4.fromQuat(R, t.orientation);
       let forward :vec3 = vec3.create();
       let up = vec3.fromValues(0, 1, 0);
       vec3.transformMat4(forward, up, R);

       vec3.scaleAndAdd(newPos,t.position, forward, -t.step);
       let b = vec2.fromValues(t.position[0], t.position[1]);
       let a = vec2.fromValues(newPos[0], newPos[1]);
       let pos = this.intersectionTest(a, b, curr_edge.src, curr_edge.dst);
       if (pos) {
         console.log("okay crossing")
         this.turtle.position = pos;
         return pos;
       }
     }
     return undefined;
   }

   /* Taken From Emily's Repo
	 * using the endpoints for an edge e and an edge o, get the point of intersection
	 * important: returns undefined if there is no intersection
	 */
   intersectionTest(e0: vec2, e1: vec2, o0: vec2, o1: vec2) : vec3 {
     // convert to Ax + By = C form
     let a1 = e1[1]- e0[1];
     let b1 = e0[0] - e1[0];
     let c1 = a1 * e0[0] + b1 * e0[1];

     let a2 = o1[1] - o0[1];
     let b2 = o0[0]- o1[0];
     let c2 = a2 * o0[0] + b2 * o0[1];

     let det = a1 * b2 - a2 * b1;

     // parallel lines
     if (Math.abs(det) < 0.001) {
       return undefined;
     } else {
       let x = (b2 * c1 - b1 * c2) / det;
       let y = (a1 * c2 - a2 * c1) / det;
       let intersection = vec3.fromValues(x, y, 0);
       return intersection;
     }
   }

   validateTurtle(t: Turtle) {
     let newPos = this.checkForIntersections(t);
     if (newPos) {
       this.turtle.position = newPos;
     }
     // let newPos2 = this.checkForPotCrossing(t);
     // if (newPos2) {
     //   this.turtle.position = newPos2;
     //   this.intersections.push(vec2.fromValues(newPos2[0], newPos2[1]));
     // }
   }

   generateHighway() {
     console.log("generating highway");
     for (let i=0; i < this.num_iterations; i++) {
       this.turtle.moveForward();
       this.validateTurtle(this.turtle);
       this.pushState();
       this.edges.push(this.getEdge(this.turtle));

       //** +/-: Choose 3 random radial directions and check for highest/threshold **//
       let max = 0;
       let max_turtle: Turtle;
       let rotation;
       for (let j = 1; j < 3; j++) {
         let dup = this.copy(this.turtle);
         rotation = Math.random() * 30;
         dup.moveForward();
         dup.adjust(rotation);
         dup.rotate(0, 0, rotation);

         if (this.voronoi(dup.position[0] * 0.01, dup.position[1]* 0.02, this.population_seed) > max) {
           max = this.voronoi(dup.position[0], dup.position[1], this.population_seed);
           max_turtle = this.copy(dup);
         }

       }
       this.turtle.orientation = max_turtle.orientation;
       this.turtle.position = max_turtle.position;
       this.validateTurtle(this.turtle);
       this.pushState();
       this.edges.push(this.getEdge(this.turtle));
     }

     for (let i = 0; i < this.turtle_stack.length; i++) {
       let t = this.turtle_stack[i];
       let curr_trans = t.getTransformation();
       this.highway_trans_mat.push(curr_trans);
     }
   }

   generateRoad() {

     for (let i = 0; i < this.edges.length; i++) {
       let curr_edge = this.edges[i];
       let mdp_x = (curr_edge.src[0] + curr_edge.dst[0])/2;
       let mdp_y = (curr_edge.src[1] + curr_edge.dst[1])/2;
       let init = quat.create();
       quat.fromEuler(init, 0, 0,0);
       if (this.voronoi(mdp_x, mdp_y, this.elevation_seed)  < 0.3) {
         let turtle =  new Turtle(vec3.fromValues(mdp_x, mdp_y, 0.0), init, vec3.fromValues(1, 4.0, 1.0), 0.05);
         this.turtle = turtle;
         this.turtle.moveForward();
         this.pushState();
         for (let j = 0; j < this.num_iterations; j++) {
           if (Math.random() > 0.5) {
            this.turtle.moveForward();
            this.pushState();
            } else {
              this.turtle.moveForward();
              this.turtle.adjust(90);
              this.turtle.rotate(0, 0, 90);
             this.pushState();
            }
          }
       }
     }

     for (let i = 0; i < this.turtle_stack.length; i++) {
        let t = this.turtle_stack[i];
        let curr_trans = t.getTransformation();
        this.road_trans_mat.push(curr_trans);
     }
   }
}
