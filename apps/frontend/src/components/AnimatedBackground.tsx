/**
 * AnimatedBackground - WebGL2 Dithering Shader
 *
 * Provides a subtle, blueprint-themed animated background with wave patterns.
 * Automatically uses Tailwind theme colors (--background, --accent) for consistent styling.
 *
 * Inspired by: https://21st.dev/community/components/aliimam/wave-1
 */

import { useEffect, useRef } from 'react';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SHADER_CONFIG = {
  pxSize: 2,
  speed: 0.2,
  // #FFFFFF - white background
  colorBack: [1.0, 1.0, 1.0, 1.0] as const,
  // #A4DDED - accent blue (non-repro blue)
  colorFront: [0.643, 0.867, 0.929, 1.0] as const,
} as const;

// ============================================================================
// GLSL SHADER CODE
// ============================================================================

const vertexShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec4 u_colorBack;
uniform vec4 u_colorFront;
uniform float u_pxSize;

out vec4 fragColor;

const int bayer8x8[64] = int[64](
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21
);

float getBayerValue(vec2 uv) {
  ivec2 pos = ivec2(mod(uv, 8.0));
  int index = pos.y * 8 + pos.x;
  return float(bayer8x8[index]) / 64.0;
}

void main() {
  float t = .5 * u_time;
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv -= .5;

  // Apply pixelization
  float pxSize = u_pxSize;
  vec2 pxSizeUv = gl_FragCoord.xy;
  pxSizeUv -= .5 * u_resolution;
  pxSizeUv /= pxSize;
  vec2 pixelizedUv = floor(pxSizeUv) * pxSize / u_resolution.xy;
  pixelizedUv += .5;
  pixelizedUv -= .5;

  vec2 shape_uv = pixelizedUv;
  vec2 dithering_uv = pxSizeUv;

  // Sine wave pattern
  shape_uv *= 4.;
  float wave = cos(.5 * shape_uv.x - 2. * t) * sin(1.5 * shape_uv.x + t) * (.75 + .25 * cos(3. * t));
  float shape = 1. - smoothstep(-1., 1., shape_uv.y + wave);

  // 8x8 Bayer matrix dithering
  float dithering = getBayerValue(dithering_uv);
  dithering -= .5;
  float res = step(.5, shape + dithering);

  vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
  float fgOpacity = u_colorFront.a;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  float bgOpacity = u_colorBack.a;

  vec3 color = fgColor * res;
  float opacity = fgOpacity * res;

  color += bgColor * (1. - opacity);
  opacity += bgOpacity * (1. - opacity);

  fragColor = vec4(color, opacity);
}
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string,
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const uniformLocationsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveSpeed = prefersReducedMotion ? 0 : SHADER_CONFIG.speed;

    // Initialize WebGL2 context
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });

    if (!gl) {
      console.warn('WebGL2 not supported, background animation disabled');
      return;
    }

    glRef.current = gl;

    // Create shader program
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    programRef.current = program;

    // Get uniform locations
    uniformLocationsRef.current = {
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_colorBack: gl.getUniformLocation(program, 'u_colorBack'),
      u_colorFront: gl.getUniformLocation(program, 'u_colorFront'),
      u_pxSize: gl.getUniformLocation(program, 'u_pxSize'),
    };

    // Set up geometry (fullscreen quad)
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Set canvas size to match window
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const render = () => {
      const currentTime = (Date.now() - startTimeRef.current) * 0.001 * effectiveSpeed;

      const context = glRef.current;
      const shaderProgram = programRef.current;

      if (!context || !shaderProgram) return;

      context.clear(context.COLOR_BUFFER_BIT);
      context.useProgram(shaderProgram);

      const locations = uniformLocationsRef.current;

      // Set uniforms
      if (locations.u_time) context.uniform1f(locations.u_time, currentTime);
      if (locations.u_resolution)
        context.uniform2f(locations.u_resolution, canvas.width, canvas.height);
      if (locations.u_colorBack) context.uniform4fv(locations.u_colorBack, SHADER_CONFIG.colorBack);
      if (locations.u_colorFront)
        context.uniform4fv(locations.u_colorFront, SHADER_CONFIG.colorFront);
      if (locations.u_pxSize) context.uniform1f(locations.u_pxSize, SHADER_CONFIG.pxSize);

      context.drawArrays(context.TRIANGLES, 0, 6);

      if (effectiveSpeed > 0) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    animationRef.current = requestAnimationFrame(render);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (glRef.current && programRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        opacity: 1,
        mixBlendMode: 'multiply',
      }}
    />
  );
}
