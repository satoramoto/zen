// The small amount of WebGL2 a fullscreen fragment pass needs, and nothing more (lifted from
// openflowfm/visuals `client/render/gl.ts` at 3bcc202, render targets dropped: every material is
// one pass straight into the shared drawing buffer).

/**
 * One triangle, not two. A fullscreen quad is two triangles with a seam down the diagonal, where
 * neighbouring fragments come from different primitives; one oversized triangle covers the
 * viewport with no seam and one fewer vertex. No attributes: the corners come from
 * `gl_VertexID`. `vUv` runs 0–1 across the viewport, bottom-left origin (GL's).
 */
export const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export interface Program {
  program: WebGLProgram;
  /** A uniform's location, looked up once and cached (null when the shader doesn't declare it). */
  uniform(name: string): WebGLUniformLocation | null;
}

/** Compile and link a fragment shader against the fullscreen vertex shader; throws with the GL log. */
export function compile(gl: WebGL2RenderingContext, fragment: string, label = 'shader'): Program {
  const build = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error(`${label}: could not create a shader`);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`${label}: ${log ?? 'compile failed'}`);
    }
    return shader;
  };

  const vs = build(gl.VERTEX_SHADER, VERTEX);
  let fs: WebGLShader;
  try {
    fs = build(gl.FRAGMENT_SHADER, fragment);
  } catch (e) {
    gl.deleteShader(vs);
    throw e;
  }
  const program = gl.createProgram();
  if (!program) throw new Error(`${label}: could not create a program`);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`${label}: ${log ?? 'link failed'}`);
  }

  // Uniform lookups are string hashes into the driver, so they are cached: a frame sets a dozen
  // per canvas and this runs every display frame.
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    program,
    uniform(name) {
      let loc = cache.get(name);
      if (loc === undefined) {
        loc = gl.getUniformLocation(program, name);
        cache.set(name, loc);
      }
      return loc;
    },
  };
}

/** Draw the fullscreen triangle with the bound program into the current viewport. */
export function drawFullscreen(gl: WebGL2RenderingContext): void {
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
