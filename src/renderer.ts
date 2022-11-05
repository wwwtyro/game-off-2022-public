import { mat4 } from "gl-matrix";
import REGL, { Regl } from "regl";

import spriteShader from "./glsl/sprite.glsl?raw";
import lineShader from "./glsl/lines.glsl?raw";
import { Resources } from "./resources";
import { modulo } from "./outline";

export class Renderer {
  regl: Regl;
  renderSprite: REGL.DrawCommand;
  renderLines: REGL.DrawCommand;

  constructor(private canvas: HTMLCanvasElement, private resources: Resources) {
    this.regl = REGL({ canvas, extensions: ["angle_instanced_arrays"] });

    const textures = {
      playerZero: this.regl.texture({ data: resources["enemyZero"].canvas, min: "linear mipmap linear", mag: "linear" }),
    };

    this.renderSprite = this.regl({
      vert: spriteShader.split("glsl-split")[0],
      frag: spriteShader.split("glsl-split")[1],

      attributes: {
        position: [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5],
      },

      uniforms: {
        albedo: textures.playerZero,
        model: this.regl.prop<any, any>("model"),
        view: this.regl.prop<any, any>("view"),
        projection: this.regl.prop<any, any>("projection"),
      },

      depth: {
        enable: false,
        mask: false,
      },

      count: 6,
      viewport: this.regl.prop<any, any>("viewport"),
    });

    const roundCapJoin = roundCapJoinGeometry(this.regl, 8);
    this.renderLines = this.regl({
      vert: lineShader.split("glsl-split")[0],
      frag: lineShader.split("glsl-split")[1],

      attributes: {
        position: {
          buffer: roundCapJoin.buffer,
          divisor: 0,
        },
        pointA: {
          buffer: this.regl.prop<any, any>("points"),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        pointB: {
          buffer: this.regl.prop<any, any>("points"),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 2,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
      },

      uniforms: {
        width: this.regl.prop<any, any>("width"),
        color: this.regl.prop<any, any>("color"),
        model: this.regl.prop<any, any>("model"),
        view: this.regl.prop<any, any>("view"),
        projection: this.regl.prop<any, any>("projection"),
      },

      depth: {
        enable: false,
        mask: false,
      },

      cull: {
        enable: true,
        face: "back",
      },

      count: roundCapJoin.count,
      instances: this.regl.prop<any, any>("segments"),
      viewport: this.regl.prop<any, any>("viewport"),
    });
  }

  public render(outline: number[][]) {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    const viewport = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };

    const model = mat4.create();
    mat4.rotateZ(model, model, performance.now() * 0.00025);
    mat4.scale(model, model, [this.resources["enemyZero"].aspect, 1, 1]);
    const view = mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0]);
    const fovv = 0.75;
    const fovh = (fovv * this.canvas.width) / this.canvas.height;
    const projection = mat4.ortho(mat4.create(), -fovh, fovh, -fovv, fovv, 0, 1000);

    this.regl.clear({ color: [0.1, 0.1, 0.1, 1], depth: 1 });

    const points = [];
    for (let i = 0; i < outline.length; i++) {
      points.push(outline[i + 0]);
      points.push(outline[modulo(i + 1, outline.length)]);
    }

    this.renderSprite({
      model,
      view,
      projection,
      viewport,
    });

    this.renderLines({
      model,
      view,
      projection,
      viewport,
      color: [1, 0.5, 1, 1],
      width: 0.005,
      points: points,
      segments: points.length / 2,
    });
  }
}

function roundCapJoinGeometry(regl: Regl, resolution: number) {
  const instanceRoundRound = [
    [0, -0.5, 0],
    [0, -0.5, 1],
    [0, 0.5, 1],
    [0, -0.5, 0],
    [0, 0.5, 1],
    [0, 0.5, 0],
  ];
  // Add the left cap.
  for (let step = 0; step < resolution; step++) {
    const theta0 = Math.PI / 2 + ((step + 0) * Math.PI) / resolution;
    const theta1 = Math.PI / 2 + ((step + 1) * Math.PI) / resolution;
    instanceRoundRound.push([0, 0, 0]);
    instanceRoundRound.push([0.5 * Math.cos(theta0), 0.5 * Math.sin(theta0), 0]);
    instanceRoundRound.push([0.5 * Math.cos(theta1), 0.5 * Math.sin(theta1), 0]);
  }
  // Add the right cap.
  for (let step = 0; step < resolution; step++) {
    const theta0 = (3 * Math.PI) / 2 + ((step + 0) * Math.PI) / resolution;
    const theta1 = (3 * Math.PI) / 2 + ((step + 1) * Math.PI) / resolution;
    instanceRoundRound.push([0, 0, 1]);
    instanceRoundRound.push([0.5 * Math.cos(theta0), 0.5 * Math.sin(theta0), 1]);
    instanceRoundRound.push([0.5 * Math.cos(theta1), 0.5 * Math.sin(theta1), 1]);
  }
  return {
    buffer: regl.buffer(instanceRoundRound),
    count: instanceRoundRound.length,
  };
}
