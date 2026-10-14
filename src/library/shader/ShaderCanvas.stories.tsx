import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { ShaderCanvas } from './ShaderCanvas';
import { useShaderSupport } from './support';

// A hand-written test frag declaring the preamble's uniforms itself: theme-hued bands drifting on
// the page clock, a rim at the box's rounded edge (uRadius), and a ring from the last press.
const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uPx;
uniform float uTime;
uniform vec4 uPointer;
uniform float uRadius;
uniform vec3 uTheme[7];
uniform float uDark;
uniform float uParams[64];

float box(vec2 p, vec2 half_, float r) {
  vec2 q = abs(p) - half_ + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 css = vec2(vUv.x, 1.0 - vUv.y) * uRes / uPx;  // CSS px, top-left origin
  vec2 coord = css / 100.0;
  float speed = uParams[0];
  float t = uTime * speed;
  float w = sin(coord.x * 2.3 + t) + sin(coord.y * 3.1 - t * 1.3) + sin((coord.x + coord.y) * 1.7 + t * 0.7);
  float k = 0.5 + 0.5 * sin(w * 1.5 + uParams[1]);
  vec3 a = mix(uTheme[3], uTheme[4], k);
  vec3 b = mix(uTheme[5], uTheme[6], 1.0 - k);
  vec3 col = mix(a, b, 0.5 + 0.5 * sin(t * 0.5 + coord.y));
  vec2 half_ = uRes / uPx * 0.5;
  float d = box(css - half_, half_, uRadius);
  float rim = smoothstep(-6.0, 0.0, d);
  col = mix(col, uTheme[2], rim * 0.8);
  float ring = uPointer.w * exp(-uPointer.z * 1.5) * smoothstep(0.08, 0.0, abs(length(coord - uPointer.xy) - uPointer.z * 1.2));
  col = mix(col, uTheme[1], ring);
  float alpha = mix(0.55, 0.75, uDark);
  fragColor = vec4(col * alpha, alpha);
}`;

const SMALL = 9;

function Runner({ scale, animate, interactive, speed }: { scale: number; animate: boolean; interactive: boolean; speed: number }) {
  const supported = useShaderSupport();
  const [errors, setErrors] = useState<string[]>([]);
  const params = [speed, 0];
  const tile = (i: number, size: number) => (
    <div
      key={i}
      data-testid="shader-tile"
      style={{ position: 'relative', width: size, height: size * 0.66, borderRadius: 'var(--radius-card)', background: 'var(--surface-1)', overflow: 'hidden' }}
    >
      <ShaderCanvas
        frag={FRAG}
        params={params}
        scale={scale}
        animate={animate}
        interactive={interactive}
        onError={(m) => setErrors((e) => [...e, m])}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
  return (
    <div style={{ display: 'grid', gap: 16, color: 'var(--text-1)' }}>
      <div data-testid="support">{supported ? 'WebGL2: drawing through one shared context' : 'No shader support here (WebGL2, reduced motion or reduced transparency)'}</div>
      {errors.length > 0 && <pre data-testid="errors">{errors.join('\n')}</pre>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 640, gap: 12 }}>
        {Array.from({ length: SMALL }, (_, i) => tile(i, 160))}
      </div>
      {tile(SMALL, 640)}
    </div>
  );
}

const meta: Meta<typeof Runner> = {
  title: 'Design OS/Graph/Materials/Runner',
  decorators: [withLibraryTheme],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Ten `ShaderCanvas`es drawing one hand-written frag through the page’s single WebGL2 context: one frame loop renders each in turn into a shared hidden canvas and copies it out. Off-screen canvases cost nothing; press a tile (interactive) for a ring.',
      },
    },
  },
  args: { scale: 0.5, animate: true, interactive: true, speed: 1 },
  argTypes: {
    scale: { control: { type: 'range', min: 0.1, max: 1, step: 0.05 } },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
  },
};
export default meta;

export const Runner_: StoryObj<typeof Runner> = {
  name: 'Runner',
  render: (args) => <Runner {...args} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('canvas')).toHaveLength(SMALL + 1));
    expect(canvasElement.querySelector('[data-testid="errors"]')).toBeNull();
  },
};
