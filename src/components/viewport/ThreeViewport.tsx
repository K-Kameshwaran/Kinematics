/**
 * Kinematics - ThreeViewport.tsx
 * High-performance Three.js 3D Viewport with PBR rendering, procedural robot arm,
 * dynamic whiteboard texture, rigid-body objects, and trajectory tracing.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RobotDef, SceneObject, CartesianPose, PenStrokePoint } from '../../kinematics/types';
import { computeForwardKinematics, dhToThreeWorld } from '../../kinematics/dhMath';
import { Eye, RotateCcw, Crosshair, Sparkles, AlertTriangle } from 'lucide-react';

interface ThreeViewportProps {
  robot: RobotDef;
  jointAngles: number[]; // in radians
  showFrames: boolean;
  showTrace: boolean;
  gripperOpenAmount: number; // 0 (closed) to 1 (open)
  hasPenTool: boolean;
  penColor: string;
  penWidth: number;
  whiteboardPoints: PenStrokePoint[];
  sceneObjects: SceneObject[];
  currentPose: CartesianPose;
  safetyAlert: string | null;
  onClearTrace: () => void;
  onWhiteboardStroke?: (point: PenStrokePoint) => void;
}

// Whiteboard physical world placement
export const WHITEBOARD_CONFIG = {
  center: [0.0, 0.45, 0.52] as [number, number, number],
  width: 0.65,
  height: 0.45,
  thickness: 0.02,
};

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  robot,
  jointAngles,
  showFrames,
  showTrace,
  gripperOpenAmount,
  hasPenTool,
  penColor,
  whiteboardPoints,
  sceneObjects,
  currentPose,
  safetyAlert,
  onClearTrace,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Dynamic meshes references
  const robotGroupRef = useRef<THREE.Group>(new THREE.Group());
  const framesGroupRef = useRef<THREE.Group>(new THREE.Group());
  const objectsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const traceLineRef = useRef<THREE.Line | null>(null);
  const tracePositionsRef = useRef<number[]>([]);
  const gripperFingersRef = useRef<{ left: THREE.Mesh; right: THREE.Mesh } | null>(null);
  const penTipMeshRef = useRef<THREE.Mesh | null>(null);

  // Dynamic Whiteboard Texture & 2D Canvas
  const wbCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wbTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Initialize Whiteboard 2D Canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Subtle grid watermark
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
    wbCanvasRef.current = canvas;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    wbTextureRef.current = texture;
  }, []);

  // Update Whiteboard strokes on canvas
  useEffect(() => {
    const canvas = wbCanvasRef.current;
    const texture = wbTextureRef.current;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw whiteboard surface
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render pen strokes
    if (whiteboardPoints.length > 0) {
      let isDrawing = false;

      for (let i = 0; i < whiteboardPoints.length; i++) {
        const pt = whiteboardPoints[i];
        // Flip Y because canvas origin is top-left while board UV origin is bottom-left
        const px = pt.x * canvas.width;
        const py = (1 - pt.y) * canvas.height;

        if (pt.isNewStroke || !isDrawing) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = pt.width * 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          isDrawing = true;
        } else {
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }
    }

    texture.needsUpdate = true;
  }, [whiteboardPoints]);

  // Main Three.js Scene Setup (Mount once)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software-gl
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.12);
    sceneRef.current = scene;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.05,
      50
    );
    camera.position.set(1.4, 1.2, 1.6);
    cameraRef.current = camera;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.35, 0.1);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent camera sinking under floor
    controls.minDistance = 0.3;
    controls.maxDistance = 6.0;
    controlsRef.current = controls;

    // 5. Studio Environment & Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Directional Key Light with shadows
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(2.5, 4.0, 2.0);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 10;
      keyLight.shadow.camera.left = -1.5;
      keyLight.shadow.camera.right = 1.5;
      keyLight.shadow.camera.top = 1.5;
      keyLight.shadow.camera.bottom = -1.5;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    // Fill Light (Cool cyan tint)
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    fillLight.position.set(-2.5, 2.0, -1.5);
    scene.add(fillLight);

    // Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x0ea5e9, 0x0f172a, 0.6);
    scene.add(hemiLight);

    // 6. Floor & Table Environment
    // Large dark grid floor
    const floorGrid = new THREE.GridHelper(10, 40, 0x00d4aa, 0x1e293b);
    floorGrid.position.y = -0.75;
    scene.add(floorGrid);

    // Solid floor plane for shadows
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.751;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Work Table & Pedestal
    const tableGroup = new THREE.Group();

    // Pedestal for the robot base
    const pedGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.2, 32);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.25,
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.set(0, -0.1, 0);
    pedestal.receiveShadow = true;
    pedestal.castShadow = true;
    tableGroup.add(pedestal);

    // Heavy Industrial Table Surface
    const tableTopGeo = new THREE.BoxGeometry(1.6, 0.04, 1.6);
    const tableTopMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.7,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.set(0, -0.02, 0);
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    // Table Tabletop Grid Markings
    const tableGrid = new THREE.GridHelper(1.5, 15, 0x0ea5e9, 0x334155);
    tableGrid.position.set(0, 0.001, 0);
    tableGroup.add(tableGrid);

    // Table Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.73, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const legPositions: [number, number][] = [
      [-0.7, -0.7],
      [-0.7, 0.7],
      [0.7, -0.7],
      [0.7, 0.7],
    ];
    legPositions.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, -0.385, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    scene.add(tableGroup);

    // 7. Whiteboard Stand & Board Mesh
    const wbGroup = new THREE.Group();
    wbGroup.position.set(
      WHITEBOARD_CONFIG.center[0],
      WHITEBOARD_CONFIG.center[1],
      WHITEBOARD_CONFIG.center[2]
    );

    // Frame
    const frameGeo = new THREE.BoxGeometry(
      WHITEBOARD_CONFIG.width + 0.04,
      WHITEBOARD_CONFIG.height + 0.04,
      WHITEBOARD_CONFIG.thickness
    );
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.2,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.castShadow = true;
    wbGroup.add(frameMesh);

    // Whiteboard Board Face with Dynamic Canvas Texture
    const boardGeo = new THREE.PlaneGeometry(
      WHITEBOARD_CONFIG.width,
      WHITEBOARD_CONFIG.height
    );
    const boardMat = new THREE.MeshStandardMaterial({
      map: wbTextureRef.current,
      roughness: 0.15,
      metalness: 0.05,
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.z = WHITEBOARD_CONFIG.thickness / 2 + 0.001;
    // Rotate to face robot (Z is normal facing -Z toward robot)
    boardMesh.rotation.y = Math.PI;
    wbGroup.add(boardMesh);

    // Whiteboard Support Struts to Table
    const strutGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 12);
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const leftStrut = new THREE.Mesh(strutGeo, strutMat);
    leftStrut.position.set(-0.3, -0.3, 0);
    wbGroup.add(leftStrut);
    const rightStrut = new THREE.Mesh(strutGeo, strutMat);
    rightStrut.position.set(0.3, -0.3, 0);
    wbGroup.add(rightStrut);

    scene.add(wbGroup);

    // 8. Add Dynamic Groups for Robot, Frames, Objects & Trace
    scene.add(robotGroupRef.current);
    scene.add(framesGroupRef.current);
    scene.add(objectsGroupRef.current);

    // Trajectory Line
    const maxTrailPoints = 300;
    const trailPositions = new Float32Array(maxTrailPoints * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00d4aa,
      linewidth: 2,
      transparent: true,
      opacity: 0.75,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    trailLine.frustumCulled = false;
    scene.add(trailLine);
    traceLineRef.current = trailLine;

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Animation Loop
    let animFrameId = 0;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Trajectory Trail
  useEffect(() => {
    if (!showTrace) {
      tracePositionsRef.current = [];
      if (traceLineRef.current) {
        const posAttr = traceLineRef.current.geometry.attributes.position as THREE.BufferAttribute;
        posAttr.set(new Float32Array(posAttr.count * 3));
        posAttr.needsUpdate = true;
      }
      return;
    }

    const pts = tracePositionsRef.current;
    pts.push(currentPose.x, currentPose.y, currentPose.z);
    // Keep last 300 points (900 floats)
    if (pts.length > 900) {
      pts.splice(0, 3);
    }

    if (traceLineRef.current) {
      const posAttr = traceLineRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < posAttr.count; i++) {
        if (i < pts.length / 3) {
          arr[i * 3] = pts[i * 3];
          arr[i * 3 + 1] = pts[i * 3 + 1];
          arr[i * 3 + 2] = pts[i * 3 + 2];
        } else if (pts.length >= 3) {
          // Fill rest with last point
          arr[i * 3] = pts[pts.length - 3];
          arr[i * 3 + 1] = pts[pts.length - 2];
          arr[i * 3 + 2] = pts[pts.length - 1];
        }
      }
      posAttr.needsUpdate = true;
    }
  }, [currentPose.x, currentPose.y, currentPose.z, showTrace]);

  // Clear trace trigger
  useEffect(() => {
    tracePositionsRef.current = [];
  }, [onClearTrace]);

  // Rebuild 3D Robot Geometry & Update Joint Poses
  useEffect(() => {
    const robotGroup = robotGroupRef.current;
    const framesGroup = framesGroupRef.current;

    // Clear existing robot meshes
    while (robotGroup.children.length > 0) {
      robotGroup.remove(robotGroup.children[0]);
    }
    while (framesGroup.children.length > 0) {
      framesGroup.remove(framesGroup.children[0]);
    }

    // Compute cumulative forward kinematics frames
    const frames = computeForwardKinematics(robot.dh, jointAngles);
    const points3D: [number, number, number][] = frames.map(dhToThreeWorld);

    // 1. Build Base Mount
    const baseCylinderGeo = new THREE.CylinderGeometry(
      robot.baseRadius * 1.1,
      robot.baseRadius * 1.25,
      robot.baseHeight,
      32
    );
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseCylinderGeo, baseMat);
    baseMesh.position.set(0, robot.baseHeight / 2, 0);
    baseMesh.castShadow = true;
    robotGroup.add(baseMesh);

    // 2. Build Links connecting joints
    for (let i = 0; i < points3D.length - 1; i++) {
      const p1 = new THREE.Vector3(...points3D[i]);
      const p2 = new THREE.Vector3(...points3D[i + 1]);
      const dist = p1.distanceTo(p2);

      // Actuator Joint Sphere/Cylinder
      const jointRadius = Math.max(0.04, robot.baseRadius * 0.8 - i * 0.006);
      const jointGeo = new THREE.SphereGeometry(jointRadius, 24, 24);
      const jointMat = new THREE.MeshStandardMaterial({
        color: robot.jointColors[i % robot.jointColors.length] || 0x00d4aa,
        metalness: 0.6,
        roughness: 0.3,
      });
      const jointMesh = new THREE.Mesh(jointGeo, jointMat);
      jointMesh.position.copy(p1);
      jointMesh.castShadow = true;
      robotGroup.add(jointMesh);

      // Link Cylinder
      if (dist > 0.03) {
        const linkRadius = jointRadius * 0.75;
        const linkGeo = new THREE.CylinderGeometry(linkRadius, linkRadius * 0.95, dist, 24);
        const linkMat = new THREE.MeshStandardMaterial({
          color: robot.linkColors[i % robot.linkColors.length] || 0x475569,
          metalness: 0.75,
          roughness: 0.25,
        });
        const linkMesh = new THREE.Mesh(linkGeo, linkMat);

        // Position at midpoint and orient along segment
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        linkMesh.position.copy(mid);
        linkMesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(p2, p1).normalize()
        );
        linkMesh.castShadow = true;
        robotGroup.add(linkMesh);
      }
    }

    // 3. Build End-Effector: Gripper & Pen Tool
    const endPoint = new THREE.Vector3(...points3D[points3D.length - 1]);
    const penultimatePoint = new THREE.Vector3(...points3D[points3D.length - 2]);
    const endDir = new THREE.Vector3().subVectors(endPoint, penultimatePoint).normalize();

    // Tool Flange
    const flangeGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.025, 24);
    const flangeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const flangeMesh = new THREE.Mesh(flangeGeo, flangeMat);
    flangeMesh.position.copy(endPoint);
    flangeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endDir);
    robotGroup.add(flangeMesh);

    // Parallel Jaw Gripper Base
    const gripperBaseGeo = new THREE.BoxGeometry(0.08, 0.02, 0.04);
    const gripperBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const gripperBase = new THREE.Mesh(gripperBaseGeo, gripperBaseMat);
    gripperBase.position.copy(endPoint);
    gripperBase.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endDir);
    robotGroup.add(gripperBase);

    // Animated Gripper Fingers
    const fingerGap = 0.015 + gripperOpenAmount * 0.035; // open/close gap
    const fingerGeo = new THREE.BoxGeometry(0.012, 0.05, 0.018);
    const fingerMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.7, roughness: 0.2 });

    const leftFinger = new THREE.Mesh(fingerGeo, fingerMat);
    leftFinger.position.set(-fingerGap, 0.035, 0);
    gripperBase.add(leftFinger);

    const rightFinger = new THREE.Mesh(fingerGeo, fingerMat);
    rightFinger.position.set(fingerGap, 0.035, 0);
    gripperBase.add(rightFinger);

    gripperFingersRef.current = { left: leftFinger, right: rightFinger };

    // Pen Tool (For Draw Mode)
    if (hasPenTool) {
      const penHolderGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.09, 16);
      const penHolderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 });
      const penHolder = new THREE.Mesh(penHolderGeo, penHolderMat);
      penHolder.position.set(0, 0.05, 0);
      gripperBase.add(penHolder);

      // Colored Pen Tip
      const penTipGeo = new THREE.ConeGeometry(0.008, 0.02, 16);
      const penTipMat = new THREE.MeshStandardMaterial({ color: penColor || 0x00d4aa });
      const penTip = new THREE.Mesh(penTipGeo, penTipMat);
      penTip.position.set(0, 0.10, 0);
      penTip.rotation.x = Math.PI;
      gripperBase.add(penTip);
      penTipMeshRef.current = penTip;
    }

    // 4. Coordinate Reference Frame Triads (If enabled)
    if (showFrames) {
      frames.forEach((frameMat4) => {
        const origin = dhToThreeWorld(frameMat4);
        const triad = new THREE.AxesHelper(0.09);
        triad.position.set(...origin);
        framesGroup.add(triad);
      });
    }
  }, [robot, jointAngles, showFrames, gripperOpenAmount, hasPenTool, penColor]);

  // Update Dynamic Scene Objects (Pick & Place)
  useEffect(() => {
    const objectsGroup = objectsGroupRef.current;
    while (objectsGroup.children.length > 0) {
      objectsGroup.remove(objectsGroup.children[0]);
    }

    sceneObjects.forEach((obj) => {
      let geo: THREE.BufferGeometry;
      if (obj.type === 'box') {
        geo = new THREE.BoxGeometry(...obj.size);
      } else if (obj.type === 'cylinder') {
        geo = new THREE.CylinderGeometry(obj.size[0], obj.size[0], obj.size[1], 24);
      } else {
        geo = new THREE.SphereGeometry(obj.size[0], 24, 24);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: obj.color,
        roughness: 0.3,
        metalness: 0.5,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...obj.position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      objectsGroup.add(mesh);
    });
  }, [sceneObjects]);

  // Camera Preset Views
  const setCameraPreset = (preset: 'home' | 'top' | 'front' | 'side' | 'whiteboard') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    switch (preset) {
      case 'home':
        camera.position.set(1.4, 1.2, 1.6);
        controls.target.set(0, 0.35, 0.1);
        break;
      case 'top':
        camera.position.set(0, 2.5, 0.05);
        controls.target.set(0, 0.2, 0);
        break;
      case 'front':
        camera.position.set(0, 0.6, 2.0);
        controls.target.set(0, 0.4, 0);
        break;
      case 'side':
        camera.position.set(2.2, 0.5, 0);
        controls.target.set(0, 0.35, 0);
        break;
      case 'whiteboard':
        // Focus directly on whiteboard
        camera.position.set(0, 0.45, 1.2);
        controls.target.set(
          WHITEBOARD_CONFIG.center[0],
          WHITEBOARD_CONFIG.center[1],
          WHITEBOARD_CONFIG.center[2]
        );
        break;
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Safety Collision Alert HUD Banner */}
      {safetyAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-amber-500/90 text-slate-950 font-bold text-xs rounded-lg shadow-xl backdrop-blur-md border border-amber-300 z-20">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{safetyAlert}</span>
        </div>
      )}

      {/* End-Effector Telemetry HUD (Top-Left) */}
      <div className="absolute top-4 left-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg pointer-events-none text-xs space-y-1.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">End-Effector Pose</span>
          <span className="text-slate-400">·</span>
          <span className="font-mono text-cyan-400">{robot.name.split(' ').pop()}</span>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-slate-400 font-mono text-[11px]">
          <div>X: <span className="text-slate-100">{currentPose.x.toFixed(3)} m</span></div>
          <div>Y: <span className="text-slate-100">{currentPose.y.toFixed(3)} m</span></div>
          <div>Z: <span className="text-slate-100">{currentPose.z.toFixed(3)} m</span></div>
          <div>R: <span className="text-slate-100">{(currentPose.roll * 57.2958).toFixed(1)}°</span></div>
          <div>P: <span className="text-slate-100">{(currentPose.pitch * 57.2958).toFixed(1)}°</span></div>
          <div>Y: <span className="text-slate-100">{(currentPose.yaw * 57.2958).toFixed(1)}°</span></div>
        </div>
      </div>

      {/* Camera View Presets Toolbar (Top-Right) */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-lg shadow-md z-10 backdrop-blur-sm">
        <button
          onClick={() => setCameraPreset('home')}
          title="Isometric Home"
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setCameraPreset('whiteboard')}
          title="Whiteboard View"
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          Board
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          title="Top-Down View"
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          Top
        </button>
        <button
          onClick={() => setCameraPreset('front')}
          title="Front View"
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          Front
        </button>
        <button
          onClick={() => setCameraPreset('side')}
          title="Side View"
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          Side
        </button>
      </div>

      {/* Mini Whiteboard Live Preview (Bottom-Right) */}
      {hasPenTool && (
        <div className="absolute bottom-4 right-4 p-2 bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-1 text-[11px] font-semibold text-slate-300">
            <span>Whiteboard Surface</span>
            <span className="text-[10px] text-slate-500 font-mono">Live</span>
          </div>
          <div className="w-[180px] h-[128px] bg-white rounded border border-slate-700 overflow-hidden relative shadow-inner">
            <canvas
              ref={(el) => {
                if (el && wbCanvasRef.current) {
                  const ctx = el.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(wbCanvasRef.current, 0, 0, el.width, el.height);
                  }
                }
              }}
              width={180}
              height={128}
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
