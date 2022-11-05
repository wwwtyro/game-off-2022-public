import { mat4, vec2 } from "gl-matrix";
import REGL, { Regl } from "regl";

import spriteShader from "./glsl/sprite.glsl?raw";
import lineShader from "./glsl/lines.glsl?raw";
import { Resources, Texture } from "./resources";
import { State } from "./main";

export class Renderer {
  private regl: Regl;
  private textures = new Map<Texture, REGL.Texture>();
  private renderSprite: REGL.DrawCommand;
  private renderLines: REGL.DrawCommand;
  private tempBuffer1: REGL.Buffer;
  private tempBuffer2: REGL.Buffer;

  constructor(private canvas: HTMLCanvasElement, private resources: Resources) {
    this.regl = REGL({ canvas, extensions: ["angle_instanced_arrays"] });

    this.tempBuffer1 = this.regl.buffer(1);
    this.tempBuffer2 = this.regl.buffer(1);

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
    const fovv = state.camera.fov;
    const fovh = (fovv * this.canvas.width) / this.canvas.height;
    const projection = mat4.ortho(
      mat4.create(),
      state.camera.position[0] - fovh,
      state.camera.position[0] + fovh,
      state.camera.position[1] - fovv,
      state.camera.position[1] + fovv,
      0,
      1000
    );

    this.regl.clear({ color: [0, 0, 0, 1], depth: 1 });

    let colors: number[] = [];
    const beams: vec2[] = [];
    colors = [];
    for (const beam of state.beams) {
      beams.push(beam.lastPosition, beam.position);
      colors.push(0.5, 0.5, 1, 1);
    }

    this.tempBuffer1(colors);
    this.tempBuffer2(beams);

    this.renderLines({
      model: mat4.create(),
      view,
      projection,
      viewport,
      colors: this.tempBuffer1,
      width: 0.01,
      points: this.tempBuffer2,
      segments: beams.length / 2,
    });

    mat4.identity(model);
    mat4.translate(model, model, [state.player.position[0], state.player.position[1], 0]);
    mat4.rotateZ(model, model, state.player.rotation);
    mat4.scale(model, model, [
      (state.player.texture.scale * state.player.texture.original.width) / state.player.texture.original.height,
      state.player.texture.scale,
      1,
    ]);
    this.renderSprite({
      albedo: this.getTexture(state.player.texture),
      model,
      view,
      projection,
      viewport,
    });

    for (const enemy of state.enemies) {
      mat4.identity(model);
      mat4.translate(model, model, [enemy.position[0], enemy.position[1], 0]);
      mat4.rotateZ(model, model, enemy.rotation);
      mat4.scale(model, model, [
        (enemy.texture.scale * enemy.texture.original.width) / enemy.texture.original.height,
        enemy.texture.scale,
        1,
      ]);
      this.renderSprite({
        albedo: this.getTexture(enemy.texture),
        model,
        view,
        projection,
        viewport,
      });
    }

    const sparks: vec2[] = [];
    colors = [];
    for (const spark of state.sparks) {
      sparks.push(spark.lastPosition, spark.position);
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
