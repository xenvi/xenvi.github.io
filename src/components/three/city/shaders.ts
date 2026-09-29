export const FOG_COLOR = '#1b0736'

const fog = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  vec3 applyFog(vec3 col, vec3 world) {
    float d = length(world - cameraPosition);
    float f = 1.0 - exp(-pow(d * uFogDensity, 2.0));
    // lift fog toward magenta near the ground for that neon haze
    vec3 fc = mix(uFogColor * 1.9 + vec3(0.12, 0.0, 0.08), uFogColor, clamp(world.y / 80.0, 0.0, 1.0));
    return mix(col, fc, clamp(f, 0.0, 1.0));
  }
`

export const buildingVertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vN;
  varying vec3 vLocal;
  varying float vSeed;
  void main() {
    vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vN = normal;
    vLocal = position;
    vec3 t = instanceMatrix[3].xyz;
    vSeed = fract(sin(dot(t.xz, vec2(12.9898, 78.233))) * 43758.5453);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

export const buildingFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDim;
  uniform float uBoost;
  ${fog}
  varying vec3 vWorld;
  varying vec3 vN;
  varying vec3 vLocal;
  varying float vSeed;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 n = normalize(vN);
    float side = step(abs(n.y), 0.5);
    float yN = vLocal.y; // 0 at street, 1 at roof

    vec3 pink = vec3(1.0, 0.16, 0.58);
    vec3 teal = vec3(0.0, 0.92, 1.0);
    vec3 violet = vec3(0.58, 0.3, 1.0);
    vec3 amber = vec3(1.0, 0.68, 0.4);

    vec3 col = vec3(0.028, 0.014, 0.06) + vec3(0.06, 0.015, 0.09) * (1.0 - yN) * 0.6;

    // Windows, laid out in world units so every building has consistent scale.
    vec2 fc = abs(n.x) > 0.5 ? vWorld.zy : vWorld.xy;
    vec2 cell = vec2(1.5, 2.1) * (vSeed > 0.5 ? 1.0 : 1.3);
    vec2 id = floor(fc / cell);
    vec2 f = fract(fc / cell);
    float win = step(0.16, f.x) * step(f.x, 0.74) * step(0.28, f.y) * step(f.y, 0.72);
    float r = hash(id + vSeed * 91.0);
    float lit = step(0.66 - vSeed * 0.18, r);
    lit *= 1.0 - step(0.992, hash(id + floor(uTime * 1.5) + vSeed)); // occasional flicker
    float pick = hash(id * 1.37 + vSeed * 3.1);
    vec3 wc = pick < 0.34 ? pink : pick < 0.62 ? teal : pick < 0.9 ? violet : amber;
    if (vSeed > 0.72) wc = vSeed > 0.86 ? teal : pink; // some towers have a single mood
    float bright = 0.7 + hash(id * 3.3) * 0.8;
    // Fade window detail into an average glow with distance to avoid shimmer
    float far = smoothstep(90.0, 320.0, length(vWorld - cameraPosition));
    float pattern = mix(win * lit * bright, 0.12, far);
    col += wc * pattern * side * 1.45 * uDim;

    // Neon crown on some rooftops
    float rim = smoothstep(0.975, 0.99, yN) * side * step(0.35, vSeed);
    col += (vSeed < 0.6 ? pink : teal) * rim * 3.0 * uDim;

    // Vertical corner strips
    float horiz = abs(n.x) > 0.5 ? vLocal.z : vLocal.x;
    float strip = smoothstep(0.465, 0.49, abs(horiz)) * side * step(0.55, fract(vSeed * 7.0));
    col += (fract(vSeed * 13.0) > 0.5 ? teal : violet) * strip * 1.8 * uDim;

    // Roofs stay dark
    col = mix(col, vec3(0.02, 0.01, 0.04), step(0.5, n.y));

    col *= uBoost;
    gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
  }
`

export const groundVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

export const groundFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAvenue;
  ${fog}
  varying vec3 vWorld;

  float line(float coord, float width) {
    float g = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    return 1.0 - min(g / width, 1.0);
  }

  void main() {
    vec2 p = vWorld.xz / 6.0;
    float grid = max(line(p.x, 1.1), line(p.y, 1.1));
    float onAvenue = 1.0 - step(uAvenue, abs(vWorld.x));
    vec3 col = vec3(0.02, 0.008, 0.045);
    vec3 gridC = mix(vec3(0.62, 0.18, 1.0), vec3(1.0, 0.16, 0.6), onAvenue);
    col += gridC * grid * (0.35 + onAvenue * 0.6);

    // Center dashes + edge lines on the avenue
    float dash = step(0.5, fract(vWorld.z / 8.0 + uTime * 0.0)) * (1.0 - smoothstep(0.08, 0.2, abs(vWorld.x)));
    float edge = 1.0 - smoothstep(0.1, 0.35, abs(abs(vWorld.x) - uAvenue));
    col += vec3(0.0, 0.92, 1.0) * (edge * 1.6 + dash * 0.9);

    // Wet-asphalt sheen toward the horizon
    col += vec3(0.25, 0.04, 0.2) * onAvenue * 0.12;
    gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
  }
`

export const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`

export const skyFragment = /* glsl */ `
  varying vec3 vDir;
  uniform float uTime;
  void main() {
    float h = vDir.y;
    vec3 top = vec3(0.012, 0.004, 0.04);
    vec3 mid = vec3(0.1, 0.02, 0.22);
    vec3 horizon = vec3(0.55, 0.06, 0.42);
    vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.18, h));
    col = mix(col, top, smoothstep(0.15, 0.6, h));
    // aurora ribbon
    float band = exp(-pow((h - 0.28 - 0.04 * sin(vDir.x * 6.0 + uTime * 0.15)) * 14.0, 2.0));
    col += vec3(0.0, 0.55, 0.7) * band * 0.18;
    gl_FragColor = vec4(col, 1.0);
  }
`

export const sunFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    float disc = 1.0 - smoothstep(0.495, 0.5, r);
    float y = vUv.y;
    vec3 col = mix(vec3(0.95, 0.06, 0.5), vec3(1.0, 0.55, 0.32), smoothstep(0.1, 0.95, y));
    // Synthwave slats that thicken toward the bottom and drift downward
    float slats = step(0.5 + (0.5 - y) * 0.9, fract(y * 14.0 + uTime * 0.25));
    float cut = y < 0.55 ? slats : 1.0;
    float glow = exp(-pow(r * 3.2, 2.0)) * 0.35;
    vec3 outCol = col * disc * cut * 0.95 + vec3(1.0, 0.2, 0.6) * glow;
    float a = max(disc * cut, glow * 1.4);
    gl_FragColor = vec4(outCol, a);
  }
`

export const sunVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
