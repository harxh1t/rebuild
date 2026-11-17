import * as T from 'three';
import {box, cylinder, beam, barrel, pot, pipe, ring, roof, plant, ball, batch, person} from './primitives';
export function makeWaterPlant(){const root=new T.Group();root.name='water_house';
 cylinder(root,9,8.5,.45,'earth',[0,-.25,0],64);cylinder(root,8.9,8.9,.06,'grass',[0,-.025,0],64);cylinder(root,5.9,6,.07,'path',[0,.015,1.2],32);
 // Limewashed pump house; the gable and the roof keep the reference's strong silhouette.
 box(root,[4.8,3.1,3.7],'plaster',[0,1.85,-1.5]);box(root,[5,.48,3.9],'stone',[0,.25,-1.5]);

 // A flat triangular façade made with the same factory as every other surface.
 const facade=new T.Group();const coords=[-2.4,3.4,.36,2.4,3.4,.36,0,5.1,.36];const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(coords,3));geo.computeVertexNormals();
 importMesh(facade,geo,'plaster');root.add(facade);
 roof(root,5.7,4.5,3.4,1.7,[0,0,-1.5]);
 [-2.4,0,2.4].forEach(x=>box(root,[.17,3.1,.18],'timber',[x,1.88,.4]));[.65,3.15,3.4].forEach(y=>box(root,[4.9,.14,.18],'timber',[0,y,.43]));beam(root,[0,3.4,.45],[0,5.1,.45],.15);
 box(root,[1.15,2.05,.08],'dark',[.2,1.18,.48]);for(let i=0;i<5;i++)box(root,[.205,1.94,.08],'wood',[-.22+i*.215,1.18,.56]);box(root,[1.37,.2,.2],'timber',[.2,2.28,.57]);box(root,[1.5,.15,.7],'stoneLight',[.2,.16,.8]);for(const y of [.65,1.63])box(root,[1.07,.08,.08],'timber',[.2,y,.62]);ring(root,.055,.012,'brass',[.57,1.1,.67],[0,0,0]);
 for(const x of [-1.55,1.65]){box(root,[.85,1.05,.1],'dark',[x,1.95,.5]);for(const dx of [-.47,0,.47])box(root,[.07,1.17,.15],'wood',[x+dx,1.95,.57]);for(const y of [1.4,1.95,2.5])box(root,[1,.08,.15],'wood',[x,y,.57]);box(root,[1.1,.25,.38],'wood',[x,1.23,.7]);for(let j=0;j<4;j++){plant(root,[x-.35+j*.22,1.35,.72],.5);ball(root,.07,'flower',[x-.35+j*.22,1.65,.75]);}}
 for(let x=-2;x<2.4;x+=.65){box(root,[.58,.3,.18],x%2?'stone':'stoneLight',[x,.4,.5],[0,0,.03]);}
 // Elevated stave tank and cross-braced tower, on the right/rear of the cottage.
 for(const x of [3.1,4.6])for(const z of [-3.1,-1.5])box(root,[.2,4.2,.2],'timber',[x,2.1,z]);for(const z of [-3.1,-1.5]){beam(root,[3.1,.4,z],[4.6,3.9,z],.13);beam(root,[4.6,.4,z],[3.1,3.9,z],.13);}for(const x of [3.1,4.6]){beam(root,[x,.3,-3.1],[x,3.9,-1.5],.13);beam(root,[x,.3,-1.5],[x,3.9,-3.1],.13);}box(root,[2.1,.22,2.1],'wood',[3.85,4.2,-2.3]);barrel(root,[3.85,4.32,-2.3],1.7);
 beam(root,[5.3,0,-1.2],[4.9,4.35,-1.2],.1,'wood');beam(root,[5.8,0,-1.2],[5.4,4.35,-1.2],.1,'wood');for(let i=1;i<12;i++)beam(root,[5.3-i*.035,i*.36,-1.2],[5.8-i*.035,i*.36,-1.2],.07,'wood');
 pipe(root,[[3.1,5.4,-1.5],[2.7,5.4,-1.5],[2.7,2.6,-1.5],[2.7,2.6,.6],[1.35,2.6,.6],[1.35,.8,.6],[2.7,.8,.6]]);
 pipe(root,[[-2.5,2.9,.5],[-2.5,1.1,.5],[-3.2,1.1,.5],[-3.2,1.1,1.1],[-3.2,.9,1.1]]);
 for(const [x,y] of [[-2.5,1.7],[1.35,1.4]]){ring(root,.19,.032,'brass',[x,y,.8],[0,0,0]);beam(root,[x-.16,y,.8],[x+.16,y,.8],.025,'brass');beam(root,[x,y-.16,.8],[x,y+.16,.8],.025,'brass');}
 // Roofed stone well at the front right.
 const wx=4.4,wz=2;for(let row=0;row<3;row++)for(let i=0;i<12;i++){const a=(i+row%2*.5)/12*Math.PI*2;box(root,[.42,.27,.25],i%3?'stone':'stoneLight',[wx+Math.sin(a)*.8,.15+row*.28,wz+Math.cos(a)*.8],[0,a,0]);}cylinder(root,.65,.65,.03,'water',[wx,.35,wz]);for(const x of [wx-.95,wx+.95])box(root,[.15,2.2,.15],'timber',[x,1.1,wz]);roof(root,2.3,1.75,2.1,.75,[wx,0,wz]);beam(root,[wx-.95,1.5,wz],[wx+.95,1.5,wz],.16,'wood');cylinder(root,.025,.025,1.15,'fine',[wx,1,wz]);
 // Basins, shallow channels, storage and pots.
 for(let i=0;i<3;i++){const x=-3.8+i*1.15;box(root,[1.05,.12,1.25],'wood',[x,.2,1.6]);for(const z of [1,2.2])box(root,[1.05,.6,.1],'wood',[x,.48,z]);for(const side of [-.52,.52])box(root,[.1,.6,1.25],'wood',[x+side,.48,1.6]);box(root,[.88,.04,1.05],'water',[x,.54,1.6]);}
 for(const x of [-4.7,5.9]){barrel(root,[x,0,.1],.65);pot(root,[x+.65,0,.6],.8);}pot(root,[3.2,0,2.6],.8);pot(root,[5.5,0,2.9],1);pot(root,[6,0,2.6],.55);
 for(let i=0;i<9;i++){const z=3.3+i*.35;box(root,[.7,.07,.29],'stoneLight',[.2+Math.sin(i)*.15,.07,z],[0,Math.sin(i)*.15,0]);}
 for(const side of [-1,1])for(let i=0;i<5;i++){const x=side*(5.8-i*.1),z=-3.8+i*1.3;box(root,[.13,.95,.13],'wood',[x,.46,z]);if(i<4){beam(root,[x,.35,z],[side*(5.8-(i+1)*.1),.35,z+1.3],.08,'wood');beam(root,[x,.75,z],[side*(5.8-(i+1)*.1),.75,z+1.3],.08,'wood');}}
 for(let i=0;i<50;i++){const a=i*2.399,r=5.2+(i%7)*.36;plant(root,[Math.sin(a)*r,0,Math.cos(a)*r],.5+(i%4)*.13);if(i%3===0)ball(root,.1,'stone',[Math.sin(a)*(r-.2),.07,Math.cos(a)*(r-.2)]);}
 batch(root);const rio=person(root,[-2.5,0,3.5]);rio.name='rio';rio.rotation.y=.15;batch(rio);return root;}
// Kept here to make the material-creation invariant explicit.
import {mesh as importMesh} from './primitives';

