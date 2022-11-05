import { mat4 } from "gl-matrix";
import REGL, { Regl } from "regl";

import spriteShader from "./glsl/sprite.glsl?raw";
import lineShader from "./glsl/lines.glsl?raw";
import { Resources, Texture } from "./resources";
import { modulo } from "./outline";
import { State } from "./main";

export class Renderer {
  private regl: Regl;
  private textures = new Map<Texture, REGL.Texture>();
  private renderSprite: REGL.DrawCommand;
  private renderLines: REGL.DrawCommand;

  constructor(private canvas: HTMLCanvasElement, private resources: Resources) {
    this.regl = REGL({ canvas, extensions: ["angle_instanced_arrays"] });

    this.renderSprite = this.regl({
      vert: spriteShader.split("glsl-split")[0],
      frag: spriteShader.split("glsl-split")[1],

      attributes: {
        position: [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5],
      },

      uniforms: {
        albedo: this.regl.prop<any, any>("albedo"),
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
        color: {
          buffer: this.regl.prop<any, any>("colors"),
          divisor: 1,
        },
      },

      uniforms: {
        width: this.regl.prop<any, any>("width"),
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

  private getTexture(texture: Texture) {
    if (!this.textures.has(texture)) {
      this.textures.set(texture, this.regl.texture({ data: texture.powerOfTwo, min: "linear mipmap linear", mag: "linear" }));
    }
    return this.textures.get(texture);
  }

  public render(state: State) {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    const viewport = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };

    const model = mat4.create();
    const view = mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0]);
    const fovv = 1.5;
    const fovh = (fovv * this.canvas.width) / this.canvas.height;
    const projection = mat4.ortho(mat4.create(), -fovh, fovh, -fovv, fovv, 0, 1000);

    this.regl.clear({ color: [0, 0, 0, 1], depth: 1 });

    // const points = [];
    // for (let i = 0; i < state.player.outline.length; i++) {
    //   points.push(state.player.outline[i + 0]);
    //   points.push(state.player.outline[modulo(i + 1, state.player.outline.length)]);
    // }

    // mat4.identity(model);
    // mat4.rotateZ(model, model, state.player.sprite.rotation);

    let colors: number[] = [];
    // for (let i = 0; i < points.length / 2; i++) {
    //   colors.push(1, 0.5, 1, 1);
    // }

    // this.renderLines({
    //   model,
    //   view,
    //   projection,
    //   viewport,
    //   colors,
    //   width: 0.005,
    //   points: points,
    //   segments: points.length / 2,
    // });

    const beams: number[] = [];
    colors = [];
    for (const beam of state.beams) {
      beams.push(...beam.lastPosition, ...beam.position);
      colors.push(0.5, 0.5, 1, 1);
    }

    this.renderLines({
      model: mat4.create(),
      view,
      projection,
      viewport,
      colors,
      width: 0.01,
      points: beams,
      segments: beams.length / 2,
    });

    mat4.identity(model);
    mat4.rotateZ(model, model, state.player.sprite.rotation);
    mat4.scale(model, model, [state.player.sprite.texture.original.width / state.player.sprite.texture.original.height, 1, 1]);
    this.renderSprite({
      albedo: this.getTexture(state.player.sprite.texture),
      model,
      view,
      projection,
      viewport,
    });

    const sparks: number[] = [];
    colors = [];
    for (const spark of state.sparks) {
      sparks.push(...spark.lastPosition, ...spark.position);
      colors.push(2 * spark.energy, 1 * spark.energy, 0.5 * spark.energy, spark.energy);
    }

    this.renderLines({
      model: mat4.create(),
      view,
      projection,
      viewport,
      colors,
      width: 0.005,
      points: sparks,
      segments: sparks.length / 2,
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
