import {vec2, vec3, mat4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import Plane from './geometry/Plane';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Lsystem from './lsystem/Lsystem';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  'Map': 'Overlay',
  'Population_Density': 'Low',
  'Iterations': 20,
  'Load Scene': loadScene,
  'Elevation_seed_x': 4.4,//1.2,
  'Elevation_seed_y': 2.2,
  'Population_seed_x': 1.5,
  'Population_seed_y': 3.02,
};

let plane : Plane;
let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let population_seed: vec2 = vec2.fromValues(controls.Elevation_seed_x, controls.Elevation_seed_y);
let elevation_seed: vec2 = vec2.fromValues(controls.Population_seed_x, controls.Population_seed_y);
let lsystem: Lsystem;

let roadSquares: Square;
let highwaySquares: Square;

function loadScene() {
  roadSquares = new Square();
  roadSquares.create();
  highwaySquares = new Square();
  highwaySquares.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  plane = new Plane(vec3.fromValues(0,0,0), vec2.fromValues(window.innerWidth, window.innerHeight), 20);
  plane.create();

  // transformations = [];
  lsystem = new Lsystem(controls.Iterations, population_seed, elevation_seed);
  setTransArrays(highwaySquares, lsystem.highway_trans_mat,  [0.8, 0.678, 0.607, 1]);
  setTransArrays(roadSquares, lsystem.road_trans_mat, [ 0.8, 0.678, 0.607, 1]);
}


function setTransArrays(square: Square, transformations: mat4[], col: number[]) {

  let colorsArray = [];
  let trans1Array = [];
  let trans2Array = [];
  let trans3Array = [];
  let trans4Array = [];

  for (let i = 0; i < transformations.length; i++) {
    let trans = transformations[i];

    trans1Array.push(trans[0]);
    trans1Array.push(trans[1]);
    trans1Array.push(trans[2]);
    trans1Array.push(trans[3]);

    trans2Array.push(trans[4]);
    trans2Array.push(trans[5]);
    trans2Array.push(trans[6]);
    trans2Array.push(trans[7]);

    trans3Array.push(trans[8]);
    trans3Array.push(trans[9]);
    trans3Array.push(trans[10]);
    trans3Array.push(trans[11]);

    trans4Array.push(trans[12]);
    trans4Array.push(trans[13]);
    trans4Array.push(trans[14]);
    trans4Array.push(trans[15]);

    colorsArray.push(col[0]);
    colorsArray.push(col[1]);
    colorsArray.push(col[2]);
    colorsArray.push(col[3]);
  }

  let colors: Float32Array = new Float32Array(colorsArray);
  let trans1: Float32Array = new Float32Array(trans1Array);
  let trans2: Float32Array = new Float32Array(trans2Array);
  let trans3: Float32Array = new Float32Array(trans3Array);
  let trans4: Float32Array = new Float32Array(trans4Array);

  square.setInstanceVBOs(colors, trans1, trans2, trans3, trans4);
  square.setNumInstances(transformations.length);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Map', ['Overlay', 'Elevation', 'Population Density']);
  gui.add(controls, 'Iterations', 1, 50).step(1);
  gui.add(controls, 'Elevation_seed_x',0, 10).step(0.1);
  gui.add(controls, 'Elevation_seed_y',0, 10).step(0.1);
  gui.add(controls, 'Population_seed_x',0, 10).step(0.1);
  gui.add(controls, 'Population_seed_y',0, 10).step(0.1);
  gui.add(controls, 'Load Scene');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const planeShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/plane-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/plane-frag.glsl')),
  ]);

  let prevMap_type = 'Medium';
  let mapType = 1;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    planeShader.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    if(controls.Map != prevMap_type)
    {
        prevMap_type = controls.Map;
        switch(prevMap_type) {
          case "Overlay":
            mapType = 1;
            break;
          case "Elevation":
            mapType = 2;
            break;
          case "Population Density":
            mapType = 3;
            break;
        }
    }
    let elevation = vec2.fromValues(controls.Elevation_seed_x, controls.Elevation_seed_y);
    let population = vec2.fromValues(controls.Population_seed_x, controls.Population_seed_y);

    renderer.clear();
    // renderer.render(camera, flat, [screenQuad], mapType, elevation, population);
    // renderer.render(camera, instancedShader, [
    //   highwaySquares,
    //   roadSquares,
    // ], mapType, elevation, population);
    //
    // renderer.render(camera, instancedShader, [
    //   highwaySquares,
    //   roadSquares,
    // ], mapType, elevation, population);

    renderer.render(camera, planeShader, [plane], mapType, elevation, population);


    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
