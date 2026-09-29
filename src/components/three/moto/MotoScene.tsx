'use client'

import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial, OrbitControls, RoundedBox } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

export type Throttle = { current: number }

const PINK = new THREE.Color('#ff2e97')
const TEAL = new THREE.Color('#00f0ff')

function Rod({ a, b, r = 0.022, children }: { a: [number, number, number]; b: [number, number, number]; r?: number; children?: ReactNode }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const len = dir.length()
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    return { pos: va.add(vb).multiplyScalar(0.5), quat, len }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r, r, len, 12]} />
      {children ?? <meshStandardMaterial color="#b8b8c8" metalness={0.9} roughness={0.25} />}
    </mesh>
  )
}

function Glow({ color, intensity = 3 }: { color: THREE.Color; intensity?: number }) {
  return <meshBasicMaterial color={color.clone().multiplyScalar(intensity)} toneMapped={false} />
}

function Wheel({ position, hubMotor, spin }: { position: [number, number, number]; hubMotor?: boolean; spin: React.MutableRefObject<number> }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current) g.current.rotation.z = -spin.current
  })
  return (
    <group position={position}>
      <group ref={g}>
        <mesh castShadow>
          <torusGeometry args={[0.29, 0.075, 20, 64]} />
          <meshStandardMaterial color="#0c0a12" roughness={0.75} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.232, 0.014, 12, 64]} />
          <Glow color={hubMotor ? PINK : TEAL} intensity={2.6} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.215, 0.02, 12, 64]} />
          <meshStandardMaterial color="#26222f" metalness={0.9} roughness={0.3} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation-z={(i / 6) * Math.PI * 2}>
            <boxGeometry args={[0.018, 0.42, 0.02]} />
            <meshStandardMaterial color="#3a3446" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[hubMotor ? 0.11 : 0.045, hubMotor ? 0.11 : 0.045, hubMotor ? 0.14 : 0.12, 32]} />
          <meshStandardMaterial color="#1b1824" metalness={0.9} roughness={0.25} />
        </mesh>
        {hubMotor && (
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.1, 0.008, 8, 48]} />
            <Glow color={TEAL} intensity={3} />
          </mesh>
        )}
      </group>
      {/* brake disc stays put */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.065]}>
        <cylinderGeometry args={[0.15, 0.15, 0.006, 40]} />
        <meshStandardMaterial color="#9a9aa8" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Bike({ throttle, motion }: { throttle: Throttle; motion: boolean }) {
  const root = useRef<THREE.Group>(null)
  const spin = useRef(0)
  const speed = useRef(0)
  const headlight = useRef<THREE.MeshBasicMaterial>(null)
  const under = useRef<THREE.PointLight>(null)

  const paint = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#2a0f66', metalness: 0.6, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }),
    [],
  )
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#141019', metalness: 0.7, roughness: 0.35 }), [])

  useFrame(({ clock }, dt) => {
    const target = motion ? 1.2 + throttle.current * 22 : 0
    speed.current += (target - speed.current) * (1 - Math.exp(-dt * 2.5))
    spin.current += speed.current * dt
    if (root.current) {
      const t = clock.elapsedTime
      // wheelie-ish pitch + chassis vibration when on the throttle
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, throttle.current * 0.12, 0.08)
      root.current.position.y = throttle.current * Math.sin(t * 60) * 0.004
    }
    if (headlight.current) headlight.current.color.setRGB(2 + throttle.current * 4, 2.6 + throttle.current * 4, 3 + throttle.current * 4)
    if (under.current) under.current.intensity = 6 + throttle.current * 14
  })

  return (
    <group ref={root}>
      <group position={[0, 0, 0]}>
        <Wheel position={[0.74, 0.365, 0]} spin={spin} />
        <Wheel position={[-0.74, 0.365, 0]} spin={spin} hubMotor />

        {/* Battery pack: the heart of an electric bike */}
        <RoundedBox args={[0.66, 0.38, 0.26]} radius={0.04} position={[-0.02, 0.58, 0]} material={dark} castShadow />
        {[-0.14, 0, 0.14].map((x) => (
          <mesh key={x} position={[x - 0.02, 0.58, 0.132]}>
            <boxGeometry args={[0.09, 0.26, 0.004]} />
            <Glow color={TEAL} intensity={1.4} />
          </mesh>
        ))}
        <mesh position={[-0.02, 0.41, 0.132]}>
          <boxGeometry args={[0.62, 0.012, 0.006]} />
          <Glow color={PINK} intensity={3} />
        </mesh>

        {/* Tank shroud */}
        <RoundedBox args={[0.56, 0.2, 0.3]} radius={0.07} position={[0.12, 0.86, 0]} rotation-z={-0.18} material={paint} castShadow />
        <mesh position={[0.12, 0.86, 0.152]} rotation-z={-0.18}>
          <boxGeometry args={[0.46, 0.014, 0.004]} />
          <Glow color={PINK} intensity={3} />
        </mesh>

        {/* Seat + tail */}
        <RoundedBox args={[0.5, 0.08, 0.25]} radius={0.035} position={[-0.38, 0.87, 0]} rotation-z={0.06} material={dark} />
        <RoundedBox args={[0.36, 0.1, 0.18]} radius={0.04} position={[-0.72, 0.93, 0]} rotation-z={0.22} material={paint} />
        <mesh position={[-0.9, 0.97, 0]} rotation-z={0.22}>
          <boxGeometry args={[0.02, 0.04, 0.16]} />
          <Glow color={PINK} intensity={5} />
        </mesh>

        {/* Swingarm + shock */}
        {[-0.085, 0.085].map((z) => (
          <Rod key={z} a={[-0.74, 0.365, z]} b={[-0.22, 0.46, z]} r={0.024}>
            <meshStandardMaterial color="#2c2837" metalness={0.9} roughness={0.3} />
          </Rod>
        ))}
        <Rod a={[-0.3, 0.52, 0]} b={[-0.56, 0.8, 0]} r={0.03}>
          <Glow color={PINK} intensity={1.6} />
        </Rod>

        {/* Trellis frame hints */}
        {[-0.14, 0.14].map((z) => (
          <group key={z}>
            <Rod a={[0.5, 0.95, z * 0.6]} b={[-0.2, 0.74, z]} r={0.016}>
              <meshStandardMaterial color="#ff4fd8" metalness={0.8} roughness={0.3} emissive="#ff2e97" emissiveIntensity={0.25} />
            </Rod>
            <Rod a={[-0.2, 0.74, z]} b={[-0.6, 0.86, z * 0.6]} r={0.014}>
              <meshStandardMaterial color="#ff4fd8" metalness={0.8} roughness={0.3} emissive="#ff2e97" emissiveIntensity={0.25} />
            </Rod>
          </group>
        ))}

        {/* Forks */}
        {[-0.095, 0.095].map((z) => (
          <Rod key={z} a={[0.74, 0.365, z]} b={[0.5, 1.0, z]} r={0.024} />
        ))}
        <Rod a={[0.5, 1.02, -0.11]} b={[0.5, 1.02, 0.11]} r={0.03}>
          <meshStandardMaterial color="#1d1a26" metalness={0.8} roughness={0.3} />
        </Rod>

        {/* Handlebars */}
        <Rod a={[0.44, 1.1, -0.33]} b={[0.44, 1.1, 0.33]} r={0.014} />
        {[-0.33, 0.33].map((z) => (
          <mesh key={z} position={[0.44, 1.1, z]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.022, 0.022, 0.1, 12]} />
            <meshStandardMaterial color="#0d0b12" roughness={0.8} />
          </mesh>
        ))}

        {/* Headlight cowl */}
        <RoundedBox args={[0.14, 0.2, 0.22]} radius={0.05} position={[0.6, 0.98, 0]} rotation-z={-0.35} material={paint} />
        <mesh position={[0.665, 0.98, 0]} rotation-z={-0.35}>
          <boxGeometry args={[0.012, 0.13, 0.16]} />
          <meshBasicMaterial ref={headlight} toneMapped={false} />
        </mesh>
        <mesh position={[0.67, 1.075, 0]} rotation-z={-0.35}>
          <boxGeometry args={[0.012, 0.018, 0.18]} />
          <Glow color={TEAL} intensity={4} />
        </mesh>
      </group>

      <pointLight ref={under} position={[0, 0.08, 0]} color="#ff2e97" intensity={6} distance={2.4} />
    </group>
  )
}

function SpeedLines({ throttle }: { throttle: Throttle }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const lines = useMemo(
    () => Array.from({ length: 40 }, () => ({ x: Math.random() * 8 - 4, y: 0.1 + Math.random() * 1.6, z: (Math.random() - 0.5) * 3, s: 4 + Math.random() * 6 })),
    [],
  )
  const m = useMemo(() => new THREE.Matrix4(), [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 2.4, 3), toneMapped: false, transparent: true, opacity: 0 }), [])
  useFrame((_, dt) => {
    mat.opacity += (throttle.current * 0.8 - mat.opacity) * 0.1
    lines.forEach((l, i) => {
      l.x -= l.s * dt * (0.5 + throttle.current * 3)
      if (l.x < -4) l.x = 4
      m.makeScale(0.4 + throttle.current * 1.2, 1, 1)
      m.setPosition(l.x, l.y, l.z)
      ref.current!.setMatrixAt(i, m)
    })
    ref.current!.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, mat, lines.length]} frustumCulled={false}>
      <boxGeometry args={[1, 0.006, 0.006]} />
    </instancedMesh>
  )
}

function Stage() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={512}
          mixBlur={1}
          mixStrength={30}
          roughness={0.85}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0614"
          metalness={0.6}
          mirror={0.6}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.35, 1.38, 96]} />
        <Glow color={PINK} intensity={2.5} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.62, 1.635, 96]} />
        <Glow color={TEAL} intensity={2} />
      </mesh>
    </>
  )
}

export default function MotoScene({ throttle, motion, active, lite }: { throttle: Throttle; motion: boolean; active: boolean; lite: boolean }) {
  return (
    <Canvas
      shadows={!lite}
      frameloop={active ? 'always' : 'never'}
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [2.2, 1.3, 2.8], fov: 35 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <color attach="background" args={['#06020f']} />
      <fog attach="fog" args={['#06020f', 5, 11]} />
      <ambientLight intensity={0.25} />
      <spotLight position={[0, 5, 0]} angle={0.5} penumbra={0.8} intensity={40} castShadow color="#e6dcff" />
      <pointLight position={[-2.5, 1.5, 1.5]} color="#ff2e97" intensity={18} />
      <pointLight position={[2.5, 1.2, -1.5]} color="#00f0ff" intensity={18} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} color="#ff2e97" position={[-4, 2, 0]} scale={[1, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={4} color="#00f0ff" position={[4, 2, 0]} scale={[1, 6, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 5, 0]} scale={[6, 1, 1]} rotation-x={Math.PI / 2} />
      </Environment>
      <group position={[0, 0, 0]}>
        <Bike throttle={throttle} motion={motion} />
      </group>
      <SpeedLines throttle={throttle} />
      <Stage />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={motion}
        autoRotateSpeed={0.8}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0.6, 0]}
      />
      {!lite && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.6} radius={0.7} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
