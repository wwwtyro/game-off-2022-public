import { mat4, vec2 } from "gl-matrix";
import REGL, { Regl } from "regl";

import blurShader from "./glsl/blur.glsl?raw";
import spriteShader from "./glsl/sprite.glsl?raw";
import shadowShader from "./glsl/shadow.glsl?raw";
import surfaceShader from "./glsl/surface.glsl?raw";
import lineShader from "./glsl/lines.glsl?raw";
import { Resources } from "../controller/loading";
import { State } from "../model/model";

export class Renderer {
  private regl: Regl;
  private textures = new Map<HTMLCanvasElement, REGL.Texture>();
  private renderBlur: REGL.DrawCommand;
  private renderSprite: REGL.DrawCommand;
  private renderLines: REGL.DrawCommand;
  private renderSurface: REGL.DrawCommand;
  private renderShadow: REGL.DrawCommand;
  private tempBuffer1: REGL.Buffer;
  private tempBuffer2: REGL.Buffer;
  private tempArray1: Array<number | vec2> = [];
  private tempArray2: Array<number | vec2> = [];
  private fbShadow: REGL.Framebuffer2D[];

  constructor(private canvas: HTMLCanvasElement, resources: Resources) {
    this.regl = REGL({ canvas, extensions: ["angle_instanced_arrays", "OES_texture_float", "OES_texture_float_linear"] });

    this.tempBuffer1 = this.regl.buffer(1);
    this.tempBuffer2 = this.regl.buffer(1);

    this.fbShadow = [
      this.regl.framebuffer({ color: this.regl.texture({ min: "linear", mag: "linear" }) }),
      this.regl.framebuffer({ color: this.regl.texture({ min: "linear", mag: "linear" }) }),
    ];

    this.renderSprite = this.regl({
      vert: spriteShader.split("glsl-split")[0],
      frag: spriteShader.split("glsl-split")[1],

      attributes: {
        position: [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5],
      },

      uniforms: {
        tAlbedo: this.regl.prop<any, any>("albedo"),
        tNormal: this.regl.prop<any, any>("normal"),
        rotation: this.regl.prop<any, any>("rotation"),
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

    this.renderShadow = this.regl({
      vert: shadowShader.split("glsl-split")[0],
      frag: shadowShader.split("glsl-split")[1],

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
      framebuffer: this.fbShadow[0],
    });

    this.renderBlur = this.regl({
      vert: blurShader.split("glsl-split")[0],
      frag: blurShader.split("glsl-split")[1],

      attributes: {
        position: [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1],
      },

      uniforms: {
        resolution: this.regl.prop<any, any>("resolution"),
        direction: this.regl.prop<any, any>("direction"),
        taps: this.regl.prop<any, any>("taps"),
        tSource: this.regl.prop<any, any>("source"),
      },

      depth: {
        enable: false,
        mask: false,
      },

      count: 6,
      viewport: this.regl.prop<any, any>("viewport"),
      framebuffer: this.regl.prop<any, any>("framebuffer"),
    });

    this.renderSurface = this.regl({
      vert: surfaceShader.split("glsl-split")[0],
      frag: surfaceShader.split("glsl-split")[1],

      attributes: {
        position: [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1],
      },

      uniforms: {
        tSand: this.getTexture(resources["sand0"].powerOfTwo),
        tNoise: this.getTexture(resources["noise0"].powerOfTwo),
        tMetal: this.getTexture(resources["metal0"].powerOfTwo),
        tShadow: this.fbShadow[0],
        offset: this.regl.prop<any, any>("offset"),
        range: this.regl.prop<any, any>("range"),
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

      blend: {
        enable: true,
        func: {
          src: "src alpha",
          dst: "one minus src alpha",
        },
      },

      count: roundCapJoin.count,
      instances: this.regl.prop<any, any>("segments"),
      viewport: this.regl.prop<any, any>("viewport"),
      framebuffer: this.regl.prop<any, any>("framebuffer"),
    });
  }

  private getTexture(texture: HTMLCanvasElement) {
    if (!this.textures.has(texture)) {
      this.textures.set(
        texture,
        this.regl.texture({ data: texture, min: "linear mipmap linear", mag: "linear", wrap: "repeat", flipY: true })
      );
    }
    return this.textures.get(texture);
  }

  public render(state: State) {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    const shadowWidth = Math.round(1 * this.canvas.width);
    const shadowHeight = Math.round(1 * this.canvas.height);
    const shadowViewport = { x: 0, y: 0, width: shadowWidth, height: shadowHeight };
    this.fbShadow[0].resize(shadowWidth, shadowHeight);
    this.fbShadow[1].resize(shadowWidth, shadowHeight);

    const fovv = state.camera.fov;
    const fovh = (fovv * this.canvas.width) / this.canvas.height;

    const viewport = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
    const model = mat4.create();
    const view = mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0]);
    const projection = mat4.ortho(
      mat4.create(),
      state.camera.position[0] - fovh,
      state.camera.position[0] + fovh,
      state.camera.position[1] - fovv,
      state.camera.position[1] + fovv,
      0,
      1000
    );

    // Render shadows.
    this.regl.clear({ color: [1, 1, 1, 1], framebuffer: this.fbShadow[0] });

    mat4.identity(model);
    mat4.translate(model, model, [state.player.position[0] - 0.25, state.player.position[1] - 0.25, 0]);
    mat4.rotateZ(model, model, state.player.rotation);
    mat4.scale(model, model, [
      (state.player.texture.scale * state.player.texture.original.width) / state.player.texture.original.height,
      state.player.texture.scale,
      1,
    ]);
    this.renderShadow({
      albedo: this.getTexture(state.player.texture.powerOfTwo),
      model,
      view,
      projection,
      viewport: shadowViewport,
    });

    for (const enemy of state.enemies) {
      mat4.identity(model);
      mat4.translate(model, model, [enemy.position[0] - 0.25, enemy.position[1] - 0.25, 0]);
      mat4.rotateZ(model, model, enemy.rotation);
      mat4.scale(model, model, [
        (enemy.texture.scale * enemy.texture.original.width) / enemy.texture.original.height,
        enemy.texture.scale,
        1,
      ]);
      this.renderShadow({
        albedo: this.getTexture(enemy.texture.powerOfTwo),
        model,
        view,
        projection,
        viewport: shadowViewport,
      });
    }

    // Blur the shadows.
    for (let i = 0; i < 8; i++) {
      this.renderBlur({
        resolution: [shadowWidth, shadowHeight],
        direction: [1, 0],
        taps: 13,
        source: this.fbShadow[0],
        framebuffer: this.fbShadow[1],
        viewport: shadowViewport,
      });
      this.renderBlur({
        resolution: [shadowWidth, shadowHeight],
        direction: [0, 1],
        taps: 13,
        source: this.fbShadow[1],
        framebuffer: this.fbShadow[0],
        viewport: shadowViewport,
      });
    }

    this.regl.clear({ color: [0, 0, 0, 1], depth: 1 });

    this.renderSurface({
      offset: state.camera.position,
      range: [fovh, fovv],
      viewport,
    });

    this.tempArray1.length = 0;
    this.tempArray2.length = 0;
    for (const beam of state.beams) {
      this.tempArray1.push(0.5, 1, 1, 1);
      this.tempArray2.push(beam.lastPosition, beam.position);
    }

    this.tempBuffer1(this.tempArray1);
    this.tempBuffer2(this.tempArray2);

    this.renderLines({
      model: mat4.create(),
      view,
      projection,
      viewport,
      width: 0.01,
      colors: this.tempBuffer1,
      points: this.tempBuffer2,
      segments: state.beams.length,
      framebuffer: null,
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
      albedo: this.getTexture(state.player.texture.powerOfTwo),
      normal: this.getTexture(state.player.texture.powerOfTwoNormal),
      rotation: state.player.rotation,
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
        albedo: this.getTexture(enemy.texture.powerOfTwo),
        normal: this.getTexture(enemy.texture.powerOfTwoNormal),
        rotation: enemy.rotation,
        model,
        view,
        projection,
        viewport,
      });
    }

    this.tempArray1.length = 0;
    this.tempArray2.length = 0;
    for (const spark of state.sparks) {
      this.tempArray1.push(2 * spark.energy, 1 * spark.energy, 0.5 * spark.energy, spark.energy);
      this.tempArray2.push(spark.lastPosition, spark.position);
    }

    this.tempBuffer1(this.tempArray1);
    this.tempBuffer2(this.tempArray2);

    this.renderLines({
      model: mat4.create(),
      view,
      projection,
      viewport,
      width: 0.005,
      colors: this.tempBuffer1,
      points: this.tempBuffer2,
      segments: state.sparks.length,
      framebuffer: null,
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
