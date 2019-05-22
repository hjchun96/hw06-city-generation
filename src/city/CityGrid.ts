import { vec2, mat4, vec3, quat } from 'gl-matrix';
import TerrainInfo from '../Lsystem/TerrainInfo'
import Edge from '../Lsystem/Edge'
import BuildingHelper from './BuildingHelper'

export default class CityGrid {

  // 0 : valid, 1: road, 2: water, 3: building
  grid: number[][] = [];
  terrain: TerrainInfo;
  edges: Edge[];
  buildingLoc: vec2[] = [];
  buildingHelper : BuildingHelper;

  constructor (terrain: TerrainInfo, edges: Edge[]) {
    this.terrain = terrain;
    this.edges = edges;
    this.buildingHelper = new BuildingHelper(terrain);
    this.spawnCityGrid();
  }

  spawnCityGrid() {
    this.initializeGrid();
    this.validateGrid();
    this.generateBuildingPoints();
  }

  // reset/initialize a 100 x 100 grid
  initializeGrid() {

    for (let i = 0; i < 100; i++) {
      this.grid[i] = [];
      for (let j = 0; j < 100; j++) {
        this.grid[i][j] = 0;

        if (i % 8 == 0 || j % 8 == 0) {
          this.grid[i][j] = 1;
        }
      }
    }
  }

  // checks grid point validity
  validateGrid() {
    // Check for edges
    for (let j = 0; j < 100; j++) {
      for (let e = 0; e < this.edges.length; e++) {
        // Do a bounding box check
        let curr_edge = this.edges[e];
        let y_max = Math.max(curr_edge.a[1], curr_edge.b[1]);
        let y_min = Math.min(curr_edge.a[1], curr_edge.b[1]);
        let x_max = Math.max(curr_edge.a[0], curr_edge.b[0]);
        let x_min = Math.min(curr_edge.a[0], curr_edge.b[0]);

        if (y_min > j || j > y_max) continue;

        for (let x = Math.floor(x_min); x < Math.ceil(x_max) ; x++) {
          if (0 < x && x < 100) {
            this.grid[x][j] = 1;// thicker road
          }
        }
      }
    }

    // Check for Water
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 100; j++) {

        let new_i = (i - 100.0) * (2.0 / -200.0) - 1.0;
        let new_j = (j + 100.0) * (2.0 / 200.0) - 1.0;

        if (!this.terrain.isLand(new_i, new_j)) {
          this.grid[i][j] = 2;
        }
      }
    }
  }

  generateBuildingPoints() {
    let count = 0;
    while (count < 100) {
      let x = Math.floor(Math.random() * 100);
      let y = Math.floor(Math.random() * 100);

      let new_i = (x - 100.0) * (2.0 / -200.0) - 1.0;
      let new_j = (y + 100.0) * (2.0 / 200.0) - 1.0;

      // let valid_loc = this.clearArea(x, y);

      let valid_loc = (this.grid[x][y] == 0);

      if (x-1 >= 0) valid_loc = valid_loc && this.grid[x-1][y] == 0;
      if (y-1 >= 0) valid_loc = valid_loc && this.grid[x][y-1] == 0;
      if (x+1 < 100) valid_loc = valid_loc && this.grid[x+1][y] == 0;
      if (y+1 < 100) valid_loc = valid_loc && this.grid[x][y+1] == 0;

      if (x-1 >= 0 && y - 1 >= 0) valid_loc = valid_loc && this.grid[x-1][y-1] == 0;
      if (x+1 < 100 && y+1 < 100) valid_loc = valid_loc && this.grid[x+1][y+1] == 0;

      if (x-2 >= 0) valid_loc = valid_loc && this.grid[x-2][y] == 0;
      if (y-2>= 0) valid_loc = valid_loc && this.grid[x][y-2] == 0;
      if (x+2 < 100) valid_loc = valid_loc && this.grid[x+2][y] == 0;
      if (y+2 < 100) valid_loc = valid_loc && this.grid[x][y+2] == 0;

      if (this.terrain.getPopulation(x, y) > 0.1 && this.terrain.isLand(new_i, new_j) && valid_loc) {
        this.grid[x][y] = 3;
        count += 1;
        this.buildingLoc.push(vec2.fromValues(x, y));
      }
    }
  }

  // clearArea(x: number, y:number) {
  //
  //   let minx = Math.max(0, x - 2);
  //   let miny = Math.max(0, y - 2);
  //   let maxx =Math.min(99, x + 2);
  //   let maxy = Math.min(99, y + 2);
  //
  //   let clear : boolean;
  //   for (let i = minx; i <= maxx; i++) {
  //     for (let j = miny; j <= maxy; j++) {
  //       clear = clear && this.grid[i][j] == 0;
  //     }
  //   }
  //   return clear;
  // }

  getGridVBO() : any {

    let colorsArray = [];
    let trans1Array = [];
    let trans2Array = [];
    let trans3Array = [];
    let trans4Array = [];

    for (let i: number = 0; i < 100; i++) {
      for (let j: number = 0; j < 100; j++) {
            let cell = this.grid[i][j];

            let trans : mat4 = mat4.create();
            let translation: vec3 = vec3.fromValues(i - 50, 0.1, j- 50);
            let rotation: quat = quat.create();
            quat.rotateX(rotation, rotation, Math.PI/2.0);
            mat4.fromRotationTranslation(trans, rotation, translation)


            // if (cell == 2 || cell == 0 ) continue;
            if (cell != 1) continue;
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

            let col : number[] = [];

            if (cell == 1) {// road
              col = [60./255., 70./255., 70./255., 1.];
            } else if (cell == 3) { // building
                col = [60./255., 70./255., 70./255., 1.];//[1, 0, 0, 1];
            }
            colorsArray.push(col[0]);
            colorsArray.push(col[1]);
            colorsArray.push(col[2]);
            colorsArray.push(col[3]);

          }
        }

    let colors: Float32Array = new Float32Array(colorsArray);
    let trans1: Float32Array = new Float32Array(trans1Array);
    let trans2: Float32Array = new Float32Array(trans2Array);
    let trans3: Float32Array = new Float32Array(trans3Array);
    let trans4: Float32Array = new Float32Array(trans4Array);

    let vbo: any = {};
    vbo.colors = colors;
    vbo.trans1 = trans1;
    vbo.trans2 = trans2;
    vbo.trans3 = trans3;
    vbo.trans4 = trans4;
    return vbo;
  }

  getBuildingVBO() : any {

    let colorsArray = [];
    let trans1Array = [];
    let trans2Array = [];
    let trans3Array = [];
    let trans4Array = [];

    for (let i= 0; i < this.buildingLoc.length; i++)  {
      let curr_loc = this.buildingLoc[i];
      let all_trans = this.buildingHelper.getBuildingTrans(curr_loc)

      // building could be made of multiple cubes
      // console.log(all_trans.length);
      for (let t=0; t < all_trans.length; t++) {
        let trans = all_trans[t];
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

        let col = []
        if (all_trans.length == 5) {
          col = [1.0, 0.0, 0.0];
        } else if (all_trans.length == 2) {
          col = [0.0, 1.0, 0.0];
        } else {
          col = [0.0, 0.0, 1.0];
        }
        colorsArray.push(col[0]);
        colorsArray.push(col[1]);
        colorsArray.push(col[2]);
        colorsArray.push(1);
      }
    }

    let colors: Float32Array = new Float32Array(colorsArray);
    let trans1: Float32Array = new Float32Array(trans1Array);
    let trans2: Float32Array = new Float32Array(trans2Array);
    let trans3: Float32Array = new Float32Array(trans3Array);
    let trans4: Float32Array = new Float32Array(trans4Array);

    let vbo: any = {};
    vbo.colors = colors;
    vbo.trans1 = trans1;
    vbo.trans2 = trans2;
    vbo.trans3 = trans3;
    vbo.trans4 = trans4;
    return vbo;

  }
}
