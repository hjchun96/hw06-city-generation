import { vec2,vec3,  mat4, quat } from 'gl-matrix';
import TerrainInfo from '../Lsystem/TerrainInfo'
import Edge from '../Lsystem/Edge'

export default class CityGrid {

  terrain: TerrainInfo;

  constructor (terrain: TerrainInfo) {
    this.terrain = terrain;
  }

  getBuildingTrans(loc: vec2) : mat4[]{
    let final_trans = [];
    let y = loc[0];
    let x = loc[1];
    let pop = this.terrain.getPopulation(x, y);

    let xyScale : number;
    let zScale : number;
    let rot : number;

    if (pop > 0.7) { // stack 3
      final_trans[0] = this.getSingleBuilding(x, y, xyScale=0.8, zScale=6, rot=0);
      final_trans[1] = this.getSingleBuilding(x, y, xyScale=1.3, zScale=4, rot=60 * Math.PI/180.);
      final_trans[2] = this.getSingleBuilding(x, y, xyScale=1.3, zScale=3, rot=120 * Math.PI/180.);
      final_trans[3] = this.getSingleBuilding(x, y, xyScale=1.3, zScale=3, rot=180 * Math.PI/180.);

      if (pop > 0.9) {
        final_trans[4] = this.getSingleBuilding(x, y, xyScale=0.1, zScale=7, rot=0);
      } else {
        final_trans[4] = this.getSingleBuilding(x, y, xyScale=0.1, zScale=6, rot=0);
      }
    } else if (pop > 0.35) { // stack 2
      final_trans[0] = this.getSingleBuilding(x, y, xyScale=1, zScale=4, rot=0);
      final_trans[1] = this.getSingleBuilding(x, y, xyScale=1.3, zScale=3, rot=0);
    } else { // stack 1
      final_trans[0] = this.getSingleBuilding(x, y, xyScale=1.3, zScale=2.5, rot=0);
    }

    return final_trans;
  }

  getSingleBuilding(x: number, y: number, xyScale: number, zScale: number, rot: number) {
    let trans : mat4 = mat4.create();
    let translation: vec3 = vec3.fromValues(y - 50, zScale, x - 50);
    let rotation: quat = quat.create();
    quat.rotateX(rotation, rotation, Math.PI/2.0);
    quat.rotateZ(rotation, rotation, rot);
    let scale: vec3 = vec3.fromValues(xyScale, xyScale, zScale);
    let transformation: mat4 = mat4.create();
    mat4.fromRotationTranslationScale(trans, rotation, translation, scale);
    return trans;
  }
}
