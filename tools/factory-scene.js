// Build-time 3D source for the original assembly-loop video. Never shipped to visitors.
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createAssemblyScene(canvas, size = 768) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size); renderer.setPixelRatio(1);
  renderer.setClearColor('#0b0d0f');
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 1, .1, 60);
  const mat = (color, metalness=.25, roughness=.4) => new T.MeshStandardMaterial({color, metalness, roughness});
  const ivory=mat('#ede8dc',.2,.3), orange=mat('#dc653a',.25,.35), dark=mat('#20252a',.6,.33), steel=mat('#738087',.75,.25), black=mat('#0e1215',.25,.4);
  const glow = new T.MeshStandardMaterial({color:'#dc653a',emissive:'#dc653a',emissiveIntensity:1.2,roughness:.35});
  scene.add(new T.HemisphereLight('#e8e8de','#242323',2.3));
  const key=new T.DirectionalLight('#fff0d7',5);key.position.set(-3,7,5);key.castShadow=true;
  key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-3;key.shadow.bias=-.001;scene.add(key);
  const rim=new T.DirectionalLight('#becbd2',3);rim.position.set(4,5,-3);scene.add(rim);
  const fill=new T.DirectionalLight('#dc653a',1.5);fill.position.set(-4,2,-2);scene.add(fill);
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  function mesh(geometry, material, parent=scene) {
    const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(w,h,d,x,y,z,material,parent=scene,r=.04) {
    const m=mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)),material,parent);m.position.set(x,y,z);return m;
  }
  function cylinder(r,h,x,y,z,material,parent=scene) {
    const m=mesh(new T.CylinderGeometry(r,r,h,40),material,parent);m.position.set(x,y,z);return m;
  }
  function ball(r,x,y,z,material,parent=scene) {
    const m=mesh(new T.SphereGeometry(r,24,16),material,parent);m.position.set(x,y,z);return m;
  }
  function connect(a,b,r,material,parent=scene) {
    const m=mesh(new T.CylinderGeometry(r,r,1,20),material,parent);place(m,a,b);return m;
  }
  function place(m,a,b) {
    m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);
    m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());
  }
  // A small isolated manufacturing cell, rather than the reference's busy room.
  cylinder(2.85,.14,0,.03,0,dark);
  const rimRing=mesh(new T.TorusGeometry(2.76,.016,8,100),orange);rimRing.rotation.x=Math.PI/2;rimRing.position.y=.12;
  cylinder(.82,.18,0,.18,0,black);cylinder(.77,.04,0,.29,0,steel);
  for(const side of [-1,1]) {
    cylinder(.42,.2,side*2.05,.22,0,black);cylinder(.34,.24,side*2.05,.42,0,ivory);
    cylinder(.35,.06,side*2.05,.54,0,orange);
  }
  const robot = new T.Group();scene.add(robot);
  // Exposed charcoal chassis and ivory removable shell, with no face or branding.
  box(.78,.46,.42,0,1.92,0,dark,robot);
  for (const side of [-1,1]) {
    const x=side*.26;
    box(.29,.16,.58,x,.43,.12,dark,robot);
    ball(.14,x,.62,0,orange,robot);
    connect(V(x,.65,0),V(x,.99,.015),.075,steel,robot);
    box(.24,.54,.25,x,.93,0,ivory,robot);
    ball(.15,x,1.25,0,dark,robot);
    const knee=cylinder(.12,.06,x,1.25,.12,orange,robot);knee.rotation.x=Math.PI/2;
    connect(V(x,1.27,0),V(x,1.78,0),.085,steel,robot);
    box(.28,.48,.28,x,1.56,0,ivory,robot);
    ball(.16,x,1.86,0,steel,robot);
  }
  cylinder(.19,.2,0,2.23,0,steel,robot);
  for(let i=0;i<4;i++)box(.55,.075,.32,0,2.18+i*.12,-.025,dark,robot);
  box(.85,.84,.4,0,2.97,0,dark,robot,.09);
  box(.51,.48,.07,0,3.01,.24,black,robot);
  box(.07,.34,.025,0,3.01,.285,glow,robot);
  for(const x of [-.17,.17])for(let y=2.85;y<3.25;y+=.1)box(.085,.024,.03,x,y,.285,steel,robot);
  // Shoulder and relaxed limbs make the central subject unmistakably a robot.
  for(const side of [-1,1]) {
    ball(.2,side*.61,3.18,0,dark,robot);
    box(.28,.24,.34,side*.62,3.29,0,ivory,robot,.07);
    connect(V(side*.65,3.09,0),V(side*.72,2.58,.03),.09,steel,robot);
    box(.22,.39,.24,side*.7,2.88,0,ivory,robot);
    ball(.12,side*.73,2.55,.03,orange,robot);
    box(.2,.43,.21,side*.76,2.26,.04,ivory,robot);
    connect(V(side*.74,2.53,.03),V(side*.77,2.02,.04),.055,steel,robot);
    box(.19,.24,.15,side*.77,1.94,.06,dark,robot);
    for(let finger=0;finger<3;finger++)box(.035,.13,.07,side*.77+(finger-1)*.05,1.79,.09,steel,robot,.01);
  }
  cylinder(.12,.2,0,3.53,0,steel,robot);
  const head = new T.Group();head.position.set(0,3.96,0);robot.add(head);
  const helmet=mesh(new T.SphereGeometry(1,36,24),ivory,head);helmet.scale.set(.34,.43,.3);
  box(.52,.12,.07,0,.04,.277,black,head,.04);
  box(.36,.025,.018,0,.04,.319,glow,head,.005);
  box(.23,.1,.08,0,-.26,.235,dark,head);
  for(const side of [-1,1]) {
    const ear=cylinder(.12,.07,side*.33,-.01,0,dark,head);ear.rotation.z=Math.PI/2;
    const earCap=cylinder(.08,.075,side*.36,-.01,0,orange,head);earCap.rotation.z=Math.PI/2;
  }
  const panels=[];
  for(const side of [-1,1]) {
    const p=box(.375,.67,.11,side*.205,2.99,.30,ivory,robot,.06);
    box(.18,.025,.012,0,.18,.06,orange,p,.003);panels.push(p);
  }
  function arm(side) {
    const base=V(side*2.05,.72,0);
    connect(V(side*2.05,.55,0),base,.17,dark);
    const shoulder=ball(.22,base.x,base.y,base.z,dark);
    const segments=[];
    for(let j=0;j<2;j++) {
      const g=new T.Group();scene.add(g);
      mesh(new T.CylinderGeometry(.12,.12,1,20),dark,g);
      box(.29,.72,.21,0,0,.04,ivory,g,.05);
      box(.08,.57,.03,0,0,.16,orange,g,.014);
      segments.push(g);
    }
    const elbow=ball(.2,0,0,0,orange),wrist=ball(.15,0,0,0,dark);
    const gripper=new T.Group();scene.add(gripper);
    box(.26,.18,.18,0,0,0,orange,gripper);
    for(const sign of [-1,1])box(.045,.22,.06,sign*.1,-.1,.13,steel,gripper,.01);
    const tip=mesh(new T.CylinderGeometry(.035,.05,.21,16),steel,gripper);tip.rotation.x=Math.PI/2;tip.position.z=.2;
    return {base,segments,elbow,wrist,gripper,side};
  }
  const arms=[arm(-1),arm(1)];
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
  function update(seconds) {
    const t=((seconds%12)+12)%12;
    // Continuous loop: approach, fit and inspect the shell, then withdraw.
    const fit=smooth((t-1)/3)*(1-smooth((t-8)/3));
    panels.forEach((p,i)=>{
      const side=i?1:-1;p.position.x=side*(.205+(1-fit)*.14);p.position.z=.30+(1-fit)*.16;
      p.rotation.y=side*(1-fit)*.13;
    });
    arms.forEach((a,i)=>{
      const localFit=smooth((t-1-i*.45)/2.8)*(1-smooth((t-7.7-i*.3)/2.6));
      const target=V(a.side*(1.05-.59*localFit),2.8+.12*localFit,.95-.45*localFit);
      const direction=target.clone().sub(a.base).normalize();
      const distance=a.base.distanceTo(target);
      const outward=V(a.side*.8,1,0);outward.addScaledVector(direction,-outward.dot(direction)).normalize();
      const elbow=a.base.clone().addScaledVector(direction,distance/2).addScaledVector(outward,Math.sqrt(Math.max(.01,1.5**2-(distance/2)**2)));
      place(a.segments[0],a.base,elbow);place(a.segments[1],elbow,target);
      a.elbow.position.copy(elbow);a.wrist.position.copy(target);a.gripper.position.copy(target);
      a.gripper.lookAt(V(a.side*.3,2.97,.28));
      if(t>4&&t<7)a.gripper.rotateZ(Math.sin(t*8)*.06);
    });
    head.rotation.y=Math.sin(seconds*Math.PI/6)*.035;
    camera.position.set(5.8+Math.sin(seconds*Math.PI/6)*.12,4.2,9.5);
    camera.lookAt(0,2.1,0);
    renderer.render(scene,camera);
  }
  update(5);
  return {renderer,update};
}
