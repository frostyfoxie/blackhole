import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useRef } from 'react'

// Simple lensing shader for black hole background warping
const BlackHoleShaderMaterial = {
  uniforms: {
    envMap: { value: null },
    u_mass: { value: 2.0 },
    u_radius: { value: 0.1 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D envMap;
    uniform float u_mass;
    uniform float u_radius;
    uniform vec2 resolution;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 delta = uv - center;
      float dist = length(delta);
      float pull = u_mass / (dist * dist + 0.0001);
      vec2 warp = uv + normalize(delta) * pull * 0.0015;

      if (dist < u_radius) {
        gl_FragColor = vec4(0.0);
      } else {
        gl_FragColor = texture2D(envMap, warp);
      }
    }
  `
}

function BlackHoleBackground({ texture }) {
  const materialRef = useRef()

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={materialRef} vertexShader={BlackHoleShaderMaterial.vertexShader} fragmentShader={BlackHoleShaderMaterial.fragmentShader} uniforms={{ envMap: { value: texture }, u_mass: { value: 2.0 }, u_radius: { value: 0.1 }, resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) } }} />
    </mesh>
  )
}

function AccretionDisk() {
  const meshRef = useRef()
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.z += 0.002
  })
  return (
    <mesh ref={meshRef} rotation-x={Math.PI / 2}>
      <ringGeometry args={[1.2, 2.5, 128]} />
      <meshBasicMaterial color={'orange'} side={THREE.DoubleSide} transparent opacity={0.7} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

function Scene() {
  const backgroundTexture = useLoader(THREE.TextureLoader, '/space.jpg')

  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.4} />
      <Stars radius={100} depth={50} count={5000} fade />
      <AccretionDisk />
      <BlackHoleBackground texture={backgroundTexture} />
    </>
  )
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 75 }}>
      <Scene />
    </Canvas>
  )
}
