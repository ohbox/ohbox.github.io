/* Interactive lanyard badge, ported from index.html (#ab-lc) so it can mount into any
   container. Same model, textures and Rapier rope physics; the badge stays inside its box.
   Needs the page's importmap for "three" and "three/addons/". */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const RAPIER_URL = 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.12.0/rapier.es.js';
let rapierReady = null;

export async function mountLanyard(lc, base = './') {
  const cvEl = lc.querySelector('canvas');
  if (!rapierReady) rapierReady = import(RAPIER_URL).then(async (m) => { await m.init(); return m; });
  const RAPIER = await rapierReady;

  const gltfLoader = new GLTFLoader();
  const texLoader = new THREE.TextureLoader();
  const loadGLTF = (url) => new Promise((res, rej) => gltfLoader.load(url, res, undefined, rej));
  const loadTex = (url) => new Promise((res) => texLoader.load(url, res));

  const [gltf, lanyardTex, frontTex, backTex] = await Promise.all([
    loadGLTF(base + 'lanyard/card.glb'),
    loadTex(base + 'lanyard/lanyard.png'),
    loadTex(base + 'image/about/card-front.png?v=20260618d'),
    loadTex(base + 'image/about/card-back.png?v=20260618d'),
  ]);

  const nodes = {}, materials = {};
  gltf.scene.traverse((obj) => {
    if (obj.name) nodes[obj.name] = obj;
    if (obj.isMesh && obj.material && obj.material.name) materials[obj.material.name] = obj.material;
  });

  /* The printed insert: the original portrait with one name/role row on the front,
     and the ohbox logo on the back. The old frame and punch hole stay cropped out. */
  function insertMap(img, crop, aspect, alignY, showIdentity = false) {
    const CW = 900, CH = Math.round(CW / aspect);
    const rowH = showIdentity ? Math.round(CW * 176 / 844) : 0;
    const photoH = CH - rowH;
    const src = document.createElement('canvas'); src.width = img.width; src.height = img.height;
    const s = src.getContext('2d'); s.drawImage(img, 0, 0);
    const px = s.getImageData(370, 111, 1, 1).data; // paint over the old punch hole with the background beside it
    s.fillStyle = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')'; s.beginPath(); s.arc(440, 111, 31, 0, Math.PI * 2); s.fill();
    const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
    const ctx = cv.getContext('2d');
    const sc = Math.max(CW / crop.w, photoH / crop.h), dw = crop.w * sc, dh = crop.h * sc;
    ctx.drawImage(src, crop.x, crop.y, crop.w, crop.h, (CW - dw) / 2, (photoH - dh) * alignY, dw, dh);
    if (showIdentity) {
      // Print the same two-column information on the insert, below the photo.
      // Drawing it at texture resolution keeps both values readable at badge size.
      ctx.fillStyle = '#171717'; ctx.fillRect(0, photoH, CW, rowH);
      ctx.fillStyle = '#373737'; ctx.fillRect(0, photoH, CW, 3); ctx.fillRect(CW / 2, photoH, 3, rowH);
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#c66c4a'; ctx.font = '600 36px Arial, sans-serif';
      ctx.fillText('NAME', 38, photoH + 58); ctx.fillText('ROLE', CW / 2 + 38, photoH + 58);
      ctx.fillStyle = '#dedede'; ctx.font = '600 49px Arial, sans-serif';
      ctx.fillText('PO-HUNG LIN', 38, photoH + 130, CW / 2 - 70);
      ctx.fillText('UI/UX DESIGNER', CW / 2 + 38, photoH + 130, CW / 2 - 70);
    }
    const map = new THREE.CanvasTexture(cv);
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    return map;
  }

  /* Clear holder: a clear reflective sheet and rounded, molded edges. The studio
     environment belongs to the holder only; the insert, clip, strap and scene lights
     retain their existing artwork, placement and appearance. */
  let envTex = null;
  function stripEnvironment() {
    const env = new THREE.Scene();
    const strip = (w, h, x, y, z, rz, intensity) => {
      const light = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
        color: new THREE.Color().setScalar(intensity), side: THREE.DoubleSide, toneMapped: false,
      }));
      light.position.set(x, y, z); light.lookAt(0, 0, 0); light.rotateZ(rz); env.add(light);
    };
    // Broad side reflections describe the curved edge; a narrow, softer diagonal
    // crosses the face only as the badge turns, leaving the portrait legible.
    strip(1.2, 12, -4.5, 1, 5.5, -0.12, 4);
    strip(0.32, 12, 4.2, -0.5, 5.5, 0.16, 3);
    strip(0.16, 14, 0.8, 0, 7, -0.7, 1.2);
    strip(0.8, 12, -7, 0, -1, 0, 2);
    strip(0.55, 12, 7, 0, -1, 0, 2.5);
    strip(10, 0.6, 0, 6, 3, 0, 1.5);
    return env;
  }
  function buildHolder(cardGeo) {
    cardGeo.computeBoundingBox();
    const bb = cardGeo.boundingBox, W = bb.max.x - bb.min.x, H = bb.max.y - bb.min.y;
    const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2, top = bb.max.y, bot = bb.min.y;
    const T = W * 0.0225, g = new THREE.Group();
    const rr = (o, x, y, w, h, r) => {
      o.moveTo(x + r, y); o.lineTo(x + w - r, y); o.quadraticCurveTo(x + w, y, x + w, y + r); o.lineTo(x + w, y + h - r);
      o.quadraticCurveTo(x + w, y + h, x + w - r, y + h); o.lineTo(x + r, y + h); o.quadraticCurveTo(x, y + h, x, y + h - r);
      o.lineTo(x, y + r); o.quadraticCurveTo(x, y, x + r, y); return o;
    };
    const circle = (o, x, y, r) => { o.absarc(x, y, r, 0, Math.PI * 2, false); return o; };
    const extrude = (shape, depth, bevel = 0) => {
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth, curveSegments: 36, bevelEnabled: bevel > 0,
        bevelThickness: bevel ? depth * 0.24 : 0, bevelSize: bevel, bevelSegments: 5,
      });
      geo.translate(0, 0, cz - depth / 2);
      // Smooth the untextured molded surface so strip-light reflections flow
      // across the rounded bevels instead of jumping between flat facets.
      geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
      const smooth = mergeVertices(geo, W * 0.00001);
      smooth.computeVertexNormals(); geo.dispose(); return smooth;
    };
    const ring = (outer, inner) => { outer.holes.push(inner); return outer; };

    const R = W * 0.07, holeY = top - H * 0.085, slotW = W * 0.3, slotH = H * 0.06, holeR = W * 0.042, holeX = W * 0.3;
    const win = { x: bb.min.x + W * 0.075, y: bot + H * 0.055 }; win.w = W - W * 0.15; win.h = (top - H * 0.175) - win.y;
    const slot = (o, grow) => rr(o, cx - slotW / 2 - grow, holeY - slotH / 2 - grow, slotW + grow * 2, slotH + grow * 2, slotH / 2 + grow);

    const sheetMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.045,
      ior: 1.46, clearcoat: 1, clearcoatRoughness: 0.035,
      envMapIntensity: 0.7, transparent: true, opacity: 0.025, depthWrite: false,
    });
    sheetMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float holderFresnel = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 3.0);
        diffuseColor.a = mix(0.018, 0.2, holderFresnel);`);
    };
    // Black dielectric surfaces contribute reflections without a diffuse white
    // frame. The clear layers keep the original insert crisp at this small size.
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x000000, metalness: 0, roughness: 0.035, ior: 1.46,
      clearcoat: 0.55, clearcoatRoughness: 0.025, envMapIntensity: 0.95,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pocketMaterial = edgeMaterial.clone();
    pocketMaterial.envMapIntensity = 0.68;
    // A faint clear core keeps the molded seam readable between reflections.
    const edgeCore = new THREE.MeshBasicMaterial({ color: 0xc8d5e2, transparent: true, opacity: 0.3, depthWrite: false });
    edgeCore.onBeforeCompile = (shader) => {
      shader.uniforms.holderBounds = { value: new THREE.Vector4(bb.min.x, bot, W, H) };
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
        varying vec2 holderPosition;
        varying float holderAngle;`);
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        holderPosition = position.xy;
        holderAngle = modelViewMatrix[0][2];`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
        uniform vec4 holderBounds;
        varying vec2 holderPosition;
        varying float holderAngle;`);
      // A restrained softbox glint makes the rounded seal legible at badge size;
      // its position changes with the badge angle, while the base stays clear.
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec2 holderUV = (holderPosition - holderBounds.xy) / holderBounds.zw;
        float edgeSweep = holderUV.x + holderUV.y + holderAngle * 0.35;
        float edgeGlint = exp(-pow((edgeSweep - 1.02) / 0.09, 2.0));
        float edgeFill = exp(-pow((edgeSweep - 1.48) / 0.055, 2.0));
        diffuseColor.a = 0.22 + 0.44 * edgeGlint + 0.18 * edgeFill;`);
    };
    const addMoldedEdge = (mesh) => {
      const core = new THREE.Mesh(mesh.geometry, edgeCore);
      core.position.copy(mesh.position); core.rotation.copy(mesh.rotation); core.renderOrder = 1;
      g.add(core, mesh);
    };
    const reflectionMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x000000, metalness: 0, roughness: 0.018,
      clearcoat: 0.1, clearcoatRoughness: 0.02, envMapIntensity: 0.65,
      transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending,
    });

    const bevel = W * 0.003;
    const slab = rr(new THREE.Shape(), bb.min.x + bevel, bot + bevel, W - bevel * 2, H - bevel * 2, R - bevel);
    slab.holes.push(slot(new THREE.Path(), bevel), circle(new THREE.Path(), cx - holeX, holeY, holeR + bevel), circle(new THREE.Path(), cx + holeX, holeY, holeR + bevel));
    const slabGeo = extrude(slab, T, bevel);
    const sheet = new THREE.Mesh(slabGeo, sheetMaterial); sheet.renderOrder = 2;
    const reflections = new THREE.Mesh(slabGeo, reflectionMaterial); reflections.renderOrder = 4;

    // Rounded geometry, rather than a uniformly white outline, catches different
    // reflections on the front, outside wall and back of the clear sealed edge.
    const rimW = W * 0.014;
    const rimShape = ring(
      rr(new THREE.Shape(), bb.min.x + bevel, bot + bevel, W - bevel * 2, H - bevel * 2, R - bevel),
      rr(new THREE.Path(), bb.min.x + rimW, bot + rimW, W - rimW * 2, H - rimW * 2, R - rimW),
    );
    const rim = new THREE.Mesh(extrude(rimShape, T * 1.2, W * 0.004), edgeMaterial);
    rim.renderOrder = 2;
    const eyeletW = W * 0.007;
    const slotRim = new THREE.Mesh(extrude(ring(slot(new THREE.Shape(), eyeletW), slot(new THREE.Path(), 0)), T * 1.12, W * 0.002), edgeMaterial);
    slotRim.renderOrder = 2;
    g.add(sheet, reflections); addMoldedEdge(rim); addMoldedEdge(slotRim);
    [-1, 1].forEach((side) => {
      const x = cx + side * holeX;
      const eyelet = new THREE.Mesh(extrude(ring(circle(new THREE.Shape(), x, holeY, holeR + eyeletW), circle(new THREE.Path(), x, holeY, holeR)), T * 1.12, W * 0.002), edgeMaterial);
      eyelet.renderOrder = 2; addMoldedEdge(eyelet);
    });

    // A raised pocket seam separates the clear holder from the unchanged insert.
    const lipW = W * 0.007;
    const pocketShape = ring(
      rr(new THREE.Shape(), win.x - lipW, win.y - lipW, win.w + lipW * 2, win.h + lipW * 2, R * 0.55 + lipW),
      rr(new THREE.Path(), win.x, win.y, win.w, win.h, R * 0.55),
    );
    const pocket = new THREE.Mesh(extrude(pocketShape, T * 0.48, W * 0.0025), pocketMaterial);
    pocket.position.z = T * 0.5; pocket.renderOrder = 3;
    const rearPocket = pocket.clone(); rearPocket.position.z = -T * 0.5;
    addMoldedEdge(pocket); addMoldedEdge(rearPocket);

    // the insert, front and back, inside the pocket
    const pad = W * 0.012, iw = win.w - pad * 2, ih = win.h - pad * 2, iy = win.y + win.h / 2;
    const face = (map) => new THREE.MeshBasicMaterial({ map, toneMapped: false });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), face(insertMap(frontTex.image, { x: 18, y: 18, w: 844, h: 918 }, iw / ih, 0.15, true)));
    front.position.set(cx, iy, cz + T * 0.05);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), face(insertMap(backTex.image, { x: 18, y: 18, w: 844, h: 1268 }, iw / ih, 0.5)));
    back.position.set(cx, iy, cz - T * 0.05); back.rotation.y = Math.PI;
    g.add(front, back);
    g.userData.glass = [sheetMaterial, edgeMaterial, pocketMaterial, reflectionMaterial];
    return g;
  }

  let W_PX = lc.clientWidth || 560, H_PX = lc.clientHeight || 620;
  const renderer = new THREE.WebGLRenderer({ canvas: cvEl, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W_PX, H_PX);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  envTex = new THREE.PMREMGenerator(renderer).fromScene(stripEnvironment(), 0.015).texture;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, W_PX / H_PX, 0.1, 200);
  camera.position.set(0.10, 0.25, 9.5);
  // The scene keeps the original framing at any box size; it simply scales with the box.
  function frameCamera() { camera.position.z = 9.5; }
  frameCamera();

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2); keyLight.position.set(0, 2, 6); scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 1.3); fillLight.position.set(-4, 4, 3); scene.add(fillLight);

  const metalMat = (materials.metal ?? new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 })).clone();
  const holder = buildHolder(nodes.card.geometry);
  holder.userData.glass.forEach((m) => { m.envMap = envTex; m.needsUpdate = true; });
  const clipMesh = new THREE.Mesh(nodes.clip?.geometry, metalMat.clone());
  const clampMesh = new THREE.Mesh(nodes.clamp?.geometry, metalMat);
  if (clipMesh.material) clipMesh.material.roughness = 0.3;

  const cardInner = new THREE.Group();
  cardInner.scale.set(2.25, 2.25, 2.25);
  cardInner.position.set(0, -1.2, -0.05);
  cardInner.add(holder, clipMesh, clampMesh);
  const cardVisual = new THREE.Group();
  cardVisual.add(cardInner);
  scene.add(cardVisual);

  const world = new RAPIER.World({ x: 0, y: -42, z: 0 });
  const GY = 3.5;
  const dynBody = (x, y) => RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, 0).setLinearDamping(4.5).setAngularDamping(4.5);
  const fixedBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, GY, 0));
  const j1Body = world.createRigidBody(dynBody(0.5, GY)); world.createCollider(RAPIER.ColliderDesc.ball(0.1), j1Body);
  const j2Body = world.createRigidBody(dynBody(1.0, GY)); world.createCollider(RAPIER.ColliderDesc.ball(0.1), j2Body);
  const j3Body = world.createRigidBody(dynBody(1.5, GY)); world.createCollider(RAPIER.ColliderDesc.ball(0.1), j3Body);
  const cardBody = world.createRigidBody(dynBody(2.0, GY)); world.createCollider(RAPIER.ColliderDesc.cuboid(0.8, 1.125, 0.01), cardBody);
  const O = { x: 0, y: 0, z: 0 };
  world.createImpulseJoint(RAPIER.JointData.rope(0.6, O, O), fixedBody, j1Body, true);
  world.createImpulseJoint(RAPIER.JointData.rope(0.6, O, O), j1Body, j2Body, true);
  world.createImpulseJoint(RAPIER.JointData.rope(0.6, O, O), j2Body, j3Body, true);
  world.createImpulseJoint(RAPIER.JointData.spherical(O, { x: 0, y: 1.5, z: 0 }), j3Body, cardBody, true);

  lanyardTex.wrapS = lanyardTex.wrapT = THREE.RepeatWrapping;
  lanyardTex.colorSpace = THREE.SRGBColorSpace;

  const SEGS = 32, BAND_W = 0.06;
  const bPos = new Float32Array(SEGS * 2 * 3), bUV = new Float32Array(SEGS * 2 * 2), bIdx = [];
  for (let i = 0; i < SEGS - 1; i++) { const b = i * 2; bIdx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
  const bandGeo = new THREE.BufferGeometry();
  const bandPosBuf = new THREE.BufferAttribute(bPos, 3);
  bandPosBuf.setUsage(THREE.DynamicDrawUsage);
  bandGeo.setAttribute('position', bandPosBuf);
  bandGeo.setAttribute('uv', new THREE.BufferAttribute(bUV, 2));
  bandGeo.setIndex(bIdx);
  const bandMesh = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ map: lanyardTex, side: THREE.DoubleSide, depthTest: false }));
  bandMesh.frustumCulled = false;
  bandMesh.renderOrder = -1;
  scene.add(bandMesh);

  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
  curve.curveType = 'chordal';
  function updateBand(pts) {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i], nxt = pts[Math.min(i + 1, n - 1)], prv = pts[Math.max(i - 1, 0)];
      const tx = nxt.x - prv.x, ty = nxt.y - prv.y, len = Math.sqrt(tx * tx + ty * ty) || 1;
      const px = -ty / len * BAND_W, py = tx / len * BAND_W, bi = i * 6, t = i / (n - 1);
      bPos[bi] = p.x + px; bPos[bi + 1] = p.y + py; bPos[bi + 2] = 0.01;
      bPos[bi + 3] = p.x - px; bPos[bi + 4] = p.y - py; bPos[bi + 5] = 0.01;
      bUV[i * 4] = t * 4; bUV[i * 4 + 1] = 0; bUV[i * 4 + 2] = t * 4; bUV[i * 4 + 3] = 1;
    }
    bandPosBuf.needsUpdate = true;
  }

  const raycaster = new THREE.Raycaster();
  const hitPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const dragOff = new THREE.Vector3();
  let dragging = false;
  function screenToWorld(cx, cy) {
    const r = lc.getBoundingClientRect(); // scaled rect, so this also works inside a zoomed canvas
    raycaster.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
    const pt = new THREE.Vector3();
    raycaster.ray.intersectPlane(hitPlane, pt);
    return pt;
  }
  // Keep the badge inside its box: clamp the drag target to what the camera can see.
  function bounds() {
    const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, w = h * camera.aspect;
    return { x: w - 0.9, top: h - 0.2, bottom: -h + 1.3 };
  }
  function nearCard(pt) { const t = cardBody.translation(); return Math.abs(pt.x - t.x) < 2.5 && Math.abs(pt.y - t.y) < 3.5; }

  lc.addEventListener('pointerdown', (e) => {
    const pt = screenToWorld(e.clientX, e.clientY);
    if (!nearCard(pt)) return;
    e.stopPropagation(); // the v2 canvas must not pan while the badge is held
    const t = cardBody.translation();
    dragOff.set(pt.x - t.x, pt.y - t.y, 0);
    dragging = true;
    lc.classList.add('is-grabbing', 'was-grabbed');
    cardBody.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    lc.setPointerCapture(e.pointerId);
  });
  lc.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const pt = screenToWorld(e.clientX, e.clientY), b = bounds();
    const x = Math.max(-b.x, Math.min(b.x, pt.x - dragOff.x)), y = Math.max(b.bottom, Math.min(b.top, pt.y - dragOff.y));
    cardBody.setNextKinematicTranslation({ x, y, z: 0 });
    [j1Body, j2Body, j3Body, fixedBody].forEach((bd) => bd.wakeUp());
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    lc.classList.remove('is-grabbing');
    cardBody.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
  };
  lc.addEventListener('pointerup', release);
  lc.addEventListener('pointercancel', release);

  const j1Lerp = new THREE.Vector3(), j2Lerp = new THREE.Vector3();
  let lerpReady = false, prevT = 0, visible = true, raf = 0;
  const MAX_SPD = 50, MIN_SPD = 0;

  function loop(t) {
    raf = visible ? requestAnimationFrame(loop) : 0;
    const dt = Math.min((t - prevT) / 1000, 1 / 30);
    prevT = t;
    if (!dragging) {
      const breezeAmp = 0.001 + (Math.sin(t * 0.000317) * 0.6 + Math.sin(t * 0.000571) * 0.4) * 0.0002;
      const br = (Math.sin(t * 0.00072) * 0.65 + Math.sin(t * 0.00119) * 0.35) * breezeAmp;
      const bv = { x: br, y: 0, z: 0 };
      j1Body.applyImpulse(bv, true); j2Body.applyImpulse(bv, true); j3Body.applyImpulse(bv, true); cardBody.applyImpulse(bv, true);
      const rotCoeff = 0.3 + (Math.sin(t * 0.000413) * 0.6 + Math.sin(t * 0.000731) * 0.4) * 0.1;
      cardBody.applyTorqueImpulse({ x: 0, y: br * rotCoeff, z: 0 }, true);
    }
    world.step();
    const tr = cardBody.translation(), qt = cardBody.rotation();
    cardVisual.position.set(tr.x, tr.y, tr.z);
    cardVisual.quaternion.set(qt.x, qt.y, qt.z, qt.w);
    if (!dragging) {
      const av = cardBody.angvel(), ro = cardBody.rotation();
      cardBody.setAngvel({ x: av.x, y: av.y - ro.y * 0.05, z: av.z }, true);
    }
    const j1t = j1Body.translation(), j2t = j2Body.translation(), j3t = j3Body.translation(), ft = fixedBody.translation();
    const j1v = new THREE.Vector3(j1t.x, j1t.y, j1t.z), j2v = new THREE.Vector3(j2t.x, j2t.y, j2t.z);
    if (!lerpReady) { j1Lerp.copy(j1v); j2Lerp.copy(j2v); lerpReady = true; }
    const d1 = Math.max(0.1, Math.min(1, j1Lerp.distanceTo(j1v))), d2 = Math.max(0.1, Math.min(1, j2Lerp.distanceTo(j2v)));
    j1Lerp.lerp(j1v, dt * (MIN_SPD + d1 * (MAX_SPD - MIN_SPD)));
    j2Lerp.lerp(j2v, dt * (MIN_SPD + d2 * (MAX_SPD - MIN_SPD)));
    curve.points[0].set(j3t.x, j3t.y, j3t.z);
    curve.points[1].copy(j2Lerp);
    curve.points[2].copy(j1Lerp);
    curve.points[3].set(ft.x, ft.y, ft.z);
    updateBand(curve.getPoints(SEGS - 1));
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(loop);
  lc.classList.add('is-ready');

  // Pause physics + rendering while the box is off screen.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) { prevT = performance.now(); raf = requestAnimationFrame(loop); }
  }).observe(lc);

  new ResizeObserver(() => {
    W_PX = lc.clientWidth; H_PX = lc.clientHeight;
    if (!W_PX || !H_PX) return;
    renderer.setSize(W_PX, H_PX);
    camera.aspect = W_PX / H_PX;
    frameCamera();
    camera.updateProjectionMatrix();
  }).observe(lc);
}

/* Markup shared by v2 and v3: same labels and corner brackets as the live #ab-lc. */
export const LANYARD_HTML =
  '<div class="ab-c-tr"></div><div class="ab-c-bl"></div>' +
  '<span class="ab-lbl ab-lbl-tl">Profile</span><span class="ab-lbl ab-lbl-tr">ID. 0408</span>' +
  '<div class="ab-lbl ab-lbl-bl"><span class="ab-dot"></span><span>Open to new projects</span></div>' +
  '<span class="ab-hint">Drag the badge</span><canvas></canvas>';
