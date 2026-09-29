'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { scrollState } from '@/lib/scroll'
import { AVENUE_HALF, CITY_END, CITY_START, makeCity, mulberry32, type Building } from './layout'
import {
  FOG_COLOR,
  buildingFragment,
  buildingVertex,
  groundFragment,
  groundVertex,
  skyFragment,
  skyVertex,
  sunFragment,
  sunVertex,
} from './shaders'

type Props = { lite: boolean; overdrive: boolean; onReady: () => void }

const fogUniforms = () => ({
  uFogColor: { value: new THREE.Color(FOG_COLOR) },
  uFogDensity: { value: 0.0042 },
})

const unitBox = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1)
  g.translate(0, 0.5, 0)
  return g
})()

function Buildings({ list, dim, density = 0.0042 }: { list: Building[]; dim: number; density?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: buildingVertex,
        fragmentShader: buildingFragment,
        uniforms: {
          uTime: { value: 0 },
          uDim: { value: dim },
          uBoost: { value: 1 },
          ...fogUniforms(),
          uFogDensity: { value: density },
        },
      }),
    [dim, density],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    list.forEach((b, i) => {
      m.makeScale(b.w, b.h, b.d)
      m.setPosition(b.x, 0, b.z)
      ref.current!.setMatrixAt(i, m)
    })
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [list])

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
  })

  return <instancedMesh ref={ref} args={[unitBox, material, list.length]} frustumCulled={false} />
}

function Ground() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: groundVertex,
        fragmentShader: groundFragment,
        uniforms: { uTime: { value: 0 }, uAvenue: { value: AVENUE_HALF - 1 }, ...fogUniforms() },
        extensions: { derivatives: true } as never,
      }),
    [],
  )
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -300]} material={material}>
      <planeGeometry args={[1600, 1800]} />
    </mesh>
  )
}

function Sky() {
  const ref = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: { uTime: { value: 0 } },
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  )
  useFrame(({ camera }, dt) => {
    material.uniforms.uTime.value += dt
    ref.current?.position.copy(camera.position)
  })
  return (
    <mesh ref={ref} material={material} renderOrder={-10}>
      <sphereGeometry args={[1400, 32, 16]} />
    </mesh>
  )
}

function Sun() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sunVertex,
        fragmentShader: sunFragment,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
  })
  return (
    <mesh position={[0, 75, CITY_END - 380]} material={material} renderOrder={-5}>
      <planeGeometry args={[430, 430]} />
    </mesh>
  )
}

function Stars({ count }: { count: number }) {
  const geo = useMemo(() => {
    const rand = mulberry32(7)
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2
      const y = 0.12 + rand() * 0.88
      const r = Math.sqrt(1 - y * y)
      pos.set([Math.cos(theta) * r * 1300, y * 1300, Math.sin(theta) * r * 1300], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  const ref = useRef<THREE.Points>(null)
  useFrame(({ camera }) => ref.current?.position.copy(camera.position))
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={1.6} sizeAttenuation={false} color="#e8d9ff" transparent opacity={0.7} fog={false} />
    </points>
  )
}

/** Neon signage painted into canvas textures and hung on facades facing the avenue. */
const SIGNS = [
  { t: 'NEON', c: '#ff2e97', v: true },
  { t: '電気', c: '#00f0ff', v: true },
  { t: 'OPEN 24/7', c: '#ff4fd8', v: false },
  { t: 'EV', c: '#00f0ff', v: false },
  { t: 'MEOW', c: '#ffb347', v: true },
  { t: 'GG', c: '#9d4dff', v: false },
  { t: '猫カフェ', c: '#ff2e97', v: true },
  { t: 'RIDE', c: '#00f0ff', v: true },
  { t: 'SHIP IT', c: '#ff4fd8', v: false },
  { t: 'ゲーム', c: '#9d4dff', v: true },
  { t: 'TIFF', c: '#ff2e97', v: true },
  { t: 'VOLT', c: '#00f0ff', v: false },
]

function makeSignTexture(text: string, color: string, vertical: boolean) {
  const canvas = document.createElement('canvas')
  const w = vertical ? 160 : 512
  const h = vertical ? 512 : 160
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(10,2,24,0.85)'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.strokeRect(10, 10, w - 20, h - 20)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (vertical) {
    const chars = [...text]
    const size = Math.min(110, 440 / chars.length)
    ctx.font = `900 ${size}px "Arial Black", "Hiragino Sans", "Noto Sans CJK JP", sans-serif`
    chars.forEach((ch, i) => {
      const y = h / 2 + (i - (chars.length - 1) / 2) * size * 1.02
      ctx.shadowBlur = 24
      ctx.fillStyle = color
      ctx.fillText(ch, w / 2, y)
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(ch, w / 2, y)
    })
  } else {
    const size = Math.min(96, 900 / text.length)
    ctx.font = `900 ${size}px "Arial Black", "Hiragino Sans", sans-serif`
    ctx.shadowBlur = 24
    ctx.fillStyle = color
    ctx.fillText(text, w / 2, h / 2)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(text, w / 2, h / 2)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function Signs({ near }: { near: Building[] }) {
  const group = useRef<THREE.Group>(null)
  const signs = useMemo(() => {
    const rand = mulberry32(99)
    const front = near.filter((b) => b.row === 0 && b.z < 30 && b.h > 16)
    const out: { pos: [number, number, number]; rotY: number; size: [number, number]; tex: THREE.Texture; phase: number }[] = []
    for (let i = 0; i < front.length && out.length < 34; i += 2) {
      const b = front[i]
      const s = SIGNS[out.length % SIGNS.length]
      const size: [number, number] = s.v ? [2.2, 7] : [7, 2.2]
      const y = Math.min(b.h - size[1] / 2 - 1, 6 + rand() * (b.h - 12))
      const faceX = b.x - b.side * (b.w / 2 + 0.08)
      out.push({
        pos: [faceX, Math.max(size[1] / 2 + 2, y), b.z + (rand() - 0.5) * (b.d * 0.5)],
        rotY: b.side === 1 ? -Math.PI / 2 : Math.PI / 2,
        size,
        tex: makeSignTexture(s.t, s.c, s.v),
        phase: rand() * 100,
      })
    }
    return out
  }, [near])

  useEffect(() => () => signs.forEach((s) => s.tex.dispose()), [signs])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current?.children.forEach((child, i) => {
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
      const s = signs[i]
      const flick = Math.sin(t * 13 + s.phase) > 0.97 || (i % 5 === 0 && Math.sin(t * 2 + s.phase) > 0.96)
      m.opacity = flick ? 0.25 : 1
    })
  })

  return (
    <group ref={group}>
      {signs.map((s, i) => (
        <mesh key={i} position={s.pos} rotation-y={s.rotY}>
          <planeGeometry args={s.size} />
          <meshBasicMaterial map={s.tex} toneMapped={false} transparent color={new THREE.Color(1.8, 1.8, 1.8)} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Hover-cars and street traffic as instanced light streaks. */
function Traffic({ count, overdrive }: { count: number; overdrive: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const cars = useMemo(() => {
    const rand = mulberry32(3)
    return Array.from({ length: count }, (_, i) => {
      const dir = i % 2 === 0 ? 1 : -1
      const street = rand() > 0.55
      return {
        x: street ? dir * (2.5 + rand() * 5) : (rand() - 0.5) * 18,
        y: street ? 0.5 : 9 + rand() * 38,
        z: CITY_START - rand() * (CITY_START - CITY_END),
        speed: (street ? 30 : 22) + rand() * 40,
        dir,
        len: street ? 2.5 + rand() * 2 : 3 + rand() * 4,
      }
    })
  }, [count])

  const [geo, mat] = useMemo(() => {
    const g = new THREE.BoxGeometry(0.22, 0.12, 1)
    const m = new THREE.MeshBasicMaterial({ toneMapped: false })
    return [g, m]
  }, [])

  useLayoutEffect(() => {
    const white = new THREE.Color(2.2, 2.4, 2.6)
    const red = new THREE.Color(3, 0.25, 0.9)
    const teal = new THREE.Color(0, 2.2, 2.8)
    cars.forEach((c, i) => ref.current!.setColorAt(i, c.dir === 1 ? red : i % 3 === 0 ? teal : white))
    ref.current!.instanceColor!.needsUpdate = true
  }, [cars])

  const m = useMemo(() => new THREE.Matrix4(), [])
  useFrame((_, dt) => {
    const k = Math.min(dt, 0.05) * (overdrive ? 3 : 1)
    cars.forEach((c, i) => {
      c.z += c.dir * c.speed * k
      if (c.z > CITY_START + 20) c.z = CITY_END
      if (c.z < CITY_END) c.z = CITY_START + 20
      m.makeScale(1, 1, c.len)
      m.setPosition(c.x, c.y, c.z)
      ref.current!.setMatrixAt(i, m)
    })
    ref.current!.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />
}

function Rain({ count }: { count: number }) {
  const ref = useRef<THREE.LineSegments>(null)
  const { geo, speeds } = useMemo(() => {
    const rand = mulberry32(11)
    const pos = new Float32Array(count * 6)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * 80
      const y = rand() * 60
      const z = (rand() - 0.5) * 80
      pos.set([x, y, z, x + 0.05, y + 1.2, z], i * 6)
      speeds[i] = 40 + rand() * 30
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geo: g, speeds }
  }, [count])

  useFrame(({ camera }, dt) => {
    const arr = geo.attributes.position.array as Float32Array
    const k = Math.min(dt, 0.05)
    for (let i = 0; i < count; i++) {
      const d = speeds[i] * k
      arr[i * 6 + 1] -= d
      arr[i * 6 + 4] -= d
      if (arr[i * 6 + 1] < -10) {
        arr[i * 6 + 1] += 70
        arr[i * 6 + 4] += 70
      }
    }
    geo.attributes.position.needsUpdate = true
    ref.current?.position.set(camera.position.x, camera.position.y - 25, camera.position.z - 20)
  })

  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#b9a4ff" transparent opacity={0.22} fog={false} />
    </lineSegments>
  )
}

/** Scroll-driven flythrough with pointer parallax. */
function CameraRig() {
  const { camera } = useThree()
  const smooth = useRef({ p: 0, px: 0, py: 0, roll: 0 })
  const look = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const s = smooth.current
    const k = 1 - Math.exp(-dt * 3.5)
    s.p += (scrollState.progress - s.p) * k
    s.px += (scrollState.pointerX - s.px) * (1 - Math.exp(-dt * 2))
    s.py += (scrollState.pointerY - s.py) * (1 - Math.exp(-dt * 2))
    s.roll += (THREE.MathUtils.clamp(-scrollState.velocity * 0.0025, -0.06, 0.06) - s.roll) * k

    const p = s.p
    const rise = THREE.MathUtils.smoothstep(p, 0.7, 1)
    const z = 40 - p * 520
    const y = 4 + p * 20 + rise * 70 + Math.sin(p * Math.PI * 3) * 3
    const x = Math.sin(p * Math.PI * 4) * 4 + s.px * 2.2

    camera.position.set(x, y - s.py * 1.2, z)
    look.set(x * 0.35 + s.px * 6, y * (1 - rise * 0.85) + 6 - s.py * 3 + (1 - rise) * p * -6, z - 80)
    camera.lookAt(look)
    camera.rotation.z += s.roll
  })

  return null
}

function Scene({ lite, overdrive, onReady }: Props) {
  const city = useMemo(() => makeCity(lite ? 0.7 : 1), [lite])
  const readyOnce = useRef(false)
  useFrame(() => {
    if (!readyOnce.current) {
      readyOnce.current = true
      requestAnimationFrame(onReady)
    }
  })

  return (
    <>
      <Sky />
      <Stars count={lite ? 500 : 1400} />
      <Sun />
      <Ground />
      <Buildings list={city.far} dim={0.55} density={0.0026} />
      <Buildings list={city.near} dim={1} />
      <Signs near={city.near} />
      <Traffic count={lite ? 60 : 140} overdrive={overdrive} />
      {!lite && <Rain count={1800} />}
      <CameraRig />
      {!lite && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.25} luminanceThreshold={0.28} luminanceSmoothing={0.2} radius={0.75} />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={new THREE.Vector2(0.0007, 0.0005)}
            radialModulation={false}
            modulationOffset={0}
          />
          <Noise opacity={0.045} premultiply blendFunction={BlendFunction.SCREEN} />
          <Vignette darkness={0.72} offset={0.25} />
        </EffectComposer>
      )}
    </>
  )
}

export default function CityCanvas(props: Props) {
  return (
    <Canvas
      dpr={props.lite ? [1, 1.25] : [1, 1.6]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 62, near: 0.5, far: 3000, position: [0, 4, 40] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
    >
      <Scene {...props} />
    </Canvas>
  )
}
