'use client'

import { useEffect, useMemo, useRef, type ReactNode } from 'react'
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

const YELLOW = new THREE.Color('#d4ff1a')
const RED = new THREE.Color('#ff1a3c')

type P2 = [number, number]

/** Side-profile polygon extruded across the bike's width: gives the angular, faceted panels. */
function Panel({ pts, depth, z = 0, material, bevel = 0.012 }: { pts: P2[]; depth: number; z?: number; material: THREE.Material; bevel?: number }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3 })
    g.translate(0, 0, -depth / 2)
    return g
  }, [pts, depth, bevel])
  return <mesh geometry={geo} position-z={z} material={material} castShadow />
}

// Side profiles (x forward, y up), loosely traced from a Can-Am Pulse
const TANK: P2[] = [[0.58, 0.97], [0.44, 1.07], [0.06, 1.03], [-0.08, 0.94], [-0.02, 0.8], [0.3, 0.75], [0.52, 0.83]]
const BODY: P2[] = [[0.46, 0.8], [0.3, 0.75], [-0.02, 0.8], [-0.24, 0.72], [-0.32, 0.5], [-0.14, 0.3], [0.2, 0.28], [0.42, 0.46]]
const ACCENT: P2[] = [[0.3, 0.56], [-0.1, 0.64], [-0.17, 0.49], [0.2, 0.41]]
const SEAT: P2[] = [[-0.04, 0.96], [-0.6, 1.04], [-0.62, 0.99], [-0.1, 0.88]]
const TAIL: P2[] = [[-0.42, 1.0], [-0.9, 1.13], [-0.92, 1.09], [-0.62, 0.97], [-0.42, 0.93]]

function Wheel({ position, spin, front }: { position: [number, number, number]; spin: React.MutableRefObject<number>; front?: boolean }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current) g.current.rotation.z = -spin.current
  })
  const tube = front ? 0.07 : 0.085
  // keep rim + stripe just inside the tire's inner edge so the fatter rear tire doesn't swallow them
  const rim = 0.29 - tube - 0.008
  return (
    <group position={position}>
      <group ref={g}>
        <mesh castShadow>
          <torusGeometry args={[0.29, tube, 20, 64]} />
          <meshStandardMaterial color="#0c0b10" roughness={0.8} />
        </mesh>
        {/* signature yellow rim stripe, both faces */}
        {[-1, 1].map((s) => (
          <mesh key={s} position-z={s * 0.028}>
            <torusGeometry args={[rim + 0.004, 0.006, 8, 64]} />
            <Glow color={YELLOW} intensity={1.8} />
          </mesh>
        ))}
        <mesh>
          <torusGeometry args={[rim - 0.01, 0.022, 12, 64]} />
          <meshStandardMaterial color="#141418" metalness={0.8} roughness={0.35} />
        </mesh>
        {/* split Y-spokes */}
        {Array.from({ length: 5 }, (_, i) =>
          [-0.14, 0.14].map((o) => (
            <mesh key={`${i}${o}`} rotation-z={(i / 5) * Math.PI * 2 + o} position={[Math.sin(-((i / 5) * Math.PI * 2 + o)) * 0.11, Math.cos((i / 5) * Math.PI * 2 + o) * 0.11, 0]}>
              <boxGeometry args={[0.016, rim - 0.04, 0.018]} />
              <meshStandardMaterial color="#17161c" metalness={0.8} roughness={0.35} />
            </mesh>
          )),
        )}
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 24]} />
          <meshStandardMaterial color="#1b1a22" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, front ? 0.07 : -0.07]}>
        <cylinderGeometry args={[front ? 0.16 : 0.11, front ? 0.16 : 0.11, 0.006, 40]} />
        <meshStandardMaterial color="#a6a6b2" metalness={1} roughness={0.22} />
      </mesh>
    </group>
  )
}

/** EV instrument cluster: speed, battery, ride mode. */
function makeDashTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 220
  const g = c.getContext('2d')!
  g.fillStyle = '#05060a'
  g.fillRect(0, 0, 512, 220)
  g.strokeStyle = 'rgba(0,240,255,0.35)'
  g.lineWidth = 4
  g.strokeRect(6, 6, 500, 208)
  g.fillStyle = '#ffffff'
  g.font = '700 96px ui-monospace, monospace'
  g.textBaseline = 'middle'
  g.fillText('0', 34, 100)
  g.fillStyle = '#00f0ff'
  g.font = '600 26px ui-monospace, monospace'
  g.fillText('MPH', 100, 124)
  g.fillStyle = '#d4ff1a'
  g.fillText('READY', 34, 180)
  g.fillStyle = '#ff2e97'
  g.fillText('SPORT', 150, 180)
  // battery
  g.strokeStyle = '#ffffff'
  g.lineWidth = 4
  g.strokeRect(270, 60, 190, 70)
  g.fillRect(462, 82, 10, 26)
  const grad = g.createLinearGradient(274, 0, 456, 0)
  grad.addColorStop(0, '#00f0ff')
  grad.addColorStop(1, '#d4ff1a')
  g.fillStyle = grad
  g.fillRect(276, 66, 178 * 0.86, 58)
  g.fillStyle = '#ffffff'
  g.font = '600 30px ui-monospace, monospace'
  g.fillText('86%', 330, 170)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Bike({ throttle, motion }: { throttle: Throttle; motion: boolean }) {
  const root = useRef<THREE.Group>(null)
  const spin = useRef(0)
  const speed = useRef(0)
  const headlight = useRef<THREE.MeshBasicMaterial>(null)
  const under = useRef<THREE.PointLight>(null)

  const silver = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#cfd5dd', metalness: 0.65, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 }),
    [],
  )
  const black = useMemo(() => new THREE.MeshStandardMaterial({ color: '#121216', metalness: 0.45, roughness: 0.45 }), [])
  const gloss = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#0e0e12', metalness: 0.6, roughness: 0.25, clearcoat: 0.8 }), [])
  const seat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#26262c', roughness: 0.85 }), [])
  const dashTexture = useMemo(() => makeDashTexture(), [])
  useEffect(() => () => dashTexture.dispose(), [dashTexture])
  const yellow = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c8f000', emissive: '#b8e600', emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.35 }),
    [],
  )

  useFrame(({ clock }, dt) => {
    const target = motion ? 1.2 + throttle.current * 22 : 0
    speed.current += (target - speed.current) * (1 - Math.exp(-dt * 2.5))
    spin.current += speed.current * dt
    if (root.current) {
      const t = clock.elapsedTime
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, throttle.current * 0.12, 0.08)
      root.current.position.y = throttle.current * Math.sin(t * 60) * 0.004
    }
    if (headlight.current) headlight.current.color.setRGB(2.4 + throttle.current * 4, 2.6 + throttle.current * 4, 3 + throttle.current * 4)
    if (under.current) under.current.intensity = 6 + throttle.current * 14
  })

  return (
    <group ref={root}>
      <Wheel position={[0.74, 0.365, 0]} spin={spin} front />
      <Wheel position={[-0.74, 0.365, 0]} spin={spin} />

      {/* Front hugger */}
      <mesh position={[0.74, 0.365, 0]} rotation-z={Math.PI * 0.18}>
        <torusGeometry args={[0.39, 0.02, 8, 24, Math.PI * 0.42]} />
        <primitive object={black} attach="material" />
      </mesh>

      {/* Bodywork */}
      <Panel pts={BODY} depth={0.26} material={black} />
      <Panel pts={TANK} depth={0.3} material={silver} bevel={0.02} />
      {[-1, 1].map((s) => (
        <Panel key={s} pts={ACCENT} depth={0.004} z={s * 0.142} material={yellow} bevel={0.002} />
      ))}
      <Panel pts={SEAT} depth={0.24} material={seat} bevel={0.02} />
      <Panel pts={TAIL} depth={0.18} material={silver} bevel={0.015} />
      <mesh position={[-0.915, 1.1, 0]} rotation-z={0.26}>
        <boxGeometry args={[0.02, 0.035, 0.17]} />
        <Glow color={RED} intensity={4} />
      </mesh>

      {/* Mid-mounted motor + belt drive */}
      <mesh position={[-0.2, 0.42, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.13, 0.13, 0.24, 32]} />
        <primitive object={gloss} attach="material" />
      </mesh>
      <mesh position={[-0.2, 0.42, 0.121]}>
        <torusGeometry args={[0.1, 0.006, 8, 48]} />
        <Glow color={YELLOW} intensity={1.4} />
      </mesh>
      <RoundedBox args={[0.6, 0.13, 0.05]} radius={0.04} position={[-0.47, 0.395, -0.13]} rotation-z={0.1} material={gloss} castShadow />
      <Rod a={[-0.25, 0.44, 0.11]} b={[-0.74, 0.365, 0.11]} r={0.032}>
        <primitive object={black} attach="material" />
      </Rod>

      {/* Rear shock + subframe */}
      <Rod a={[-0.3, 0.52, 0.02]} b={[-0.46, 0.86, 0.02]} r={0.026}>
        <primitive object={black} attach="material" />
      </Rod>
      <mesh position={[-0.37, 0.67, 0.07]} rotation-z={0.44}>
        <cylinderGeometry args={[0.022, 0.022, 0.12, 16]} />
        <meshStandardMaterial color="#c0152f" metalness={0.6} roughness={0.35} />
      </mesh>
      {[-0.08, 0.08].map((z) => (
        <Rod key={z} a={[-0.26, 0.78, z]} b={[-0.72, 1.0, z]} r={0.014}>
          <primitive object={black} attach="material" />
        </Rod>
      ))}

      {/* License plate hanger: juts out behind the tail, clear of the tire */}
      <Rod a={[-0.84, 1.02, 0]} b={[-1.1, 0.9, 0]} r={0.013}>
        <primitive object={black} attach="material" />
      </Rod>
      <mesh position={[-1.12, 0.83, 0]} rotation-z={-0.12}>
        <boxGeometry args={[0.006, 0.11, 0.17]} />
        <meshStandardMaterial color="#6b6b75" roughness={0.7} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[-1.08, 0.92, sd * 0.07]}>
          <boxGeometry args={[0.03, 0.018, 0.018]} />
          <Glow color={new THREE.Color('#ff9a1a')} intensity={2.5} />
        </mesh>
      ))}

      {/* Upside-down forks */}
      {[-0.1, 0.1].map((z) => (
        <group key={z}>
          <Rod a={[0.74, 0.365, z]} b={[0.49, 1.03, z]} r={0.028}>
            <meshStandardMaterial color="#1a1a20" metalness={0.8} roughness={0.3} />
          </Rod>
          <Rod a={[0.74, 0.365, z]} b={[0.67, 0.56, z]} r={0.034}>
            <meshStandardMaterial color="#2b2b33" metalness={0.9} roughness={0.25} />
          </Rod>
        </group>
      ))}
      <RoundedBox args={[0.1, 0.05, 0.28]} radius={0.015} position={[0.49, 1.04, 0]} material={black} />

      {/* Round LED headlight */}
      <group position={[0.635, 0.97, 0]} rotation-z={-0.3}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.095, 0.085, 0.09, 32]} />
          <primitive object={black} attach="material" />
        </mesh>
        <mesh position-x={0.047} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.072, 0.072, 0.004, 32]} />
          <meshBasicMaterial ref={headlight} toneMapped={false} />
        </mesh>
        <mesh position-x={0.05} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.08, 0.007, 8, 48]} />
          <Glow color={new THREE.Color('#ffffff')} intensity={3} />
        </mesh>
      </group>

      {/* Wide TFT display centred on the bars, tilted back toward the rider */}
      <Rod a={[0.49, 1.06, 0]} b={[0.45, 1.16, 0]} r={0.018}>
        <primitive object={black} attach="material" />
      </Rod>
      <group position={[0.44, 1.21, 0]} rotation-z={0.5}>
        <RoundedBox args={[0.026, 0.13, 0.28]} radius={0.01} material={black} />
        <mesh position-x={-0.0135} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.25, 0.105]} />
          <meshBasicMaterial map={dashTexture} toneMapped={false} />
        </mesh>
      </group>

      {/* Bars (wide) + grips + round mirrors */}
      <Rod a={[0.43, 1.12, -0.42]} b={[0.43, 1.12, 0.42]} r={0.014} />
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[0.43, 1.12, sd * 0.42]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.022, 0.022, 0.11, 12]} />
            <meshStandardMaterial color="#0d0c12" roughness={0.8} />
          </mesh>
          <Rod a={[0.43, 1.12, sd * 0.32]} b={[0.4, 1.3, sd * 0.37]} r={0.008}>
            <primitive object={black} attach="material" />
          </Rod>
          <mesh position={[0.4, 1.33, sd * 0.37]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.045, 0.045, 0.012, 24]} />
            <primitive object={black} attach="material" />
          </mesh>
        </group>
      ))}

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
