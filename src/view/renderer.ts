import { mat4, vec2 } from "gl-matrix";
import REGL, { DrawCommand, Framebuffer2D, Regl, Texture2D } from "regl";

import { Resources } from "../controller/loading";
import { modulo } from "../util";
import { Camera, State } from "../model/state";
import { SmartBuffer } from "./smart-buffer";
import blurShader from "./glsl/blur.glsl?raw";
import spriteShader from "./glsl/sprite.glsl?raw";
import flameShader from "./glsl/flame.glsl?raw";
import shadowShader from "./glsl/shadow.glsl?raw";
import surfaceShader from "./glsl/surface.glsl?raw";
import lineShader from "./glsl/lines.glsl?raw";
import directionShader from "./glsl/direction.glsl?raw";

const DEBUG = false;

export class Renderer {
  private regl: Regl;
  private textures = new Map<HTMLCanvasElement, Texture2D>();
  private renderBlur: DrawCommand;
  private renderSprite: DrawCommand;
  private renderFlame: DrawCommand;
  private renderLines: DrawCommand;
  private renderSurface: DrawCommand;
  private renderShadow: DrawCommand;
  private renderDirection: DrawCommand;
  private tempBuffer1: SmartBuffer;
  private tempBuffer2: SmartBuffer;
  private tempBuffer3: SmartBuffer;
  private fbShadow: Framebuffer2D[];

  constructor(private canvas: HTMLCanvasElement, resources: Resources) {
    this.regl = REGL({
      canvas,
      extensions: ["angle_instanced_arrays"],
      attributes: {
        alpha: false,
      },
    });

    this.tempBuffer1 = new SmartBuffer(this.regl);
    this.tempBuffer2 = new SmartBuffer(this.regl);
    this.tempBuffer3 = new SmartBuffer(this.regl);

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

    this.renderDirection = this.regl({
      vert: directionShader.split("glsl-split")[0],
      frag: directionShader.split("glsl-split")[1],

      attributes: {
        position: [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5],
      },

      uniforms: {
        texture: this.getTexture(resources.textures.arrow0.powerOfTwo),
        scale: this.regl.prop<any, any>("scale"),
        rotation: this.regl.prop<any, any>("rotation"),
        time: this.regl.prop<any, any>("time"),
        color: this.regl.prop<any, any>("color"),
        resolution: this.regl.prop<any, any>("resolution"),
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

      count: 6,
      viewport: this.regl.prop<any, any>("viewport"),
    });

    this.renderFlame = this.regl({
      vert: flameShader.split("glsl-split")[0],
      frag: flameShader.split("glsl-split")[1],

      attributes: {
        position: {
          buffer: this.regl.buffer([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]),
          divisor: 0,
        },
        center: {
          buffer: this.regl.prop<any, any>("points"),
          divisor: 1,
        },
        scale: {
          buffer: this.regl.prop<any, any>("scale"),
          divisor: 1,
        },
        age: {
          buffer: this.regl.prop<any, any>("age"),
          divisor: 1,
        },
      },

      uniforms: {
        flameout: 0.5,
        smokeout: 1.5,
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

      count: 6,
      instances: this.regl.prop<any, any>("instances"),
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
        tSand: this.getTexture(resources.textures.sand0albedo.powerOfTwo),
        tSandNormal: this.getTexture(resources.textures.sand0normal.powerOfTwo),
        tMetal: this.getTexture(resources.textures.metal0albdeo.powerOfTwo),
        tMetalNormal: this.getTexture(resources.textures.metal0normal.powerOfTwo),
        tNoise: this.getTexture(resources.textures.noise0.powerOfTwo),
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

  public getFov(camera: Camera) {
    if (this.canvas.height < this.canvas.width) {
      const y = camera.fov;
      const x = (y * this.canvas.width) / this.canvas.height;
      return { x, y };
    } else {
      const x = camera.fov;
      const y = (x * this.canvas.height) / this.canvas.width;
      return { x, y };
    }
  }

  public render(state: State) {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    const shadowWidth = Math.round(1 * this.canvas.width);
    const shadowHeight = Math.round(1 * this.canvas.height);
    const shadowViewport = { x: 0, y: 0, width: shadowWidth, height: shadowHeight };
    this.fbShadow[0].resize(shadowWidth, shadowHeight);
    this.fbShadow[1].resize(shadowWidth, shadowHeight);

    const fov = this.getFov(state.camera);

    const viewport = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
    const model = mat4.create();
    const view = mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0]);
    const shakex = 0.1 * state.camera.shake * Math.cos(state.time.now * 100) * Math.cos(state.time.now);
    const shakey = 0.1 * state.camera.shake * Math.cos(state.time.now * 100) * Math.sin(state.time.now);
    const camPos = vec2.add(vec2.create(), state.camera.position, [shakex, shakey]);
    const projection = mat4.ortho(
      mat4.create(),
      camPos[0] - fov.x,
      camPos[0] + fov.x,
      camPos[1] - fov.y,
      camPos[1] + fov.y,
      0,
      1000
    );

    // Render shadows.
    this.regl.clear({ color: [1, 1, 1, 1], framebuffer: this.fbShadow[0] });

    if (!state.player.dead) {
      mat4.identity(model);
      mat4.translate(model, model, [state.player.position[0] - 0.25, state.player.position[1] - 0.25, 0]);
      mat4.rotateZ(model, model, state.player.rotation);
      mat4.scale(model, model, [
        (state.player.sprite.scale * state.player.sprite.albedo.original.width) / state.player.sprite.albedo.original.height,
        state.player.sprite.scale,
        1,
      ]);
      this.renderShadow({
        albedo: this.getTexture(state.player.sprite.albedo.powerOfTwo),
        model,
        view,
        projection,
        viewport: shadowViewport,
      });
      for (const droid of state.player.droids) {
        mat4.identity(model);
        mat4.translate(model, model, [droid.position[0] - 0.25, droid.position[1] - 0.25, 0]);
        mat4.rotateZ(model, model, droid.rotation);
        mat4.scale(model, model, [
          (droid.sprite.scale * droid.sprite.albedo.original.width) / droid.sprite.albedo.original.height,
          droid.sprite.scale,
          1,
        ]);
        this.renderShadow({
          albedo: this.getTexture(droid.sprite.albedo.powerOfTwo),
          model,
          view,
          projection,
          viewport: shadowViewport,
        });
      }
    }

    for (const enemy of state.enemies) {
      mat4.identity(model);
      mat4.translate(model, model, [enemy.position[0] - 0.25, enemy.position[1] - 0.25, 0]);
      mat4.rotateZ(model, model, enemy.rotation);
      mat4.scale(model, model, [
        (enemy.sprite.scale * enemy.sprite.albedo.original.width) / enemy.sprite.albedo.original.height,
        enemy.sprite.scale,
        1,
      ]);
      this.renderShadow({
        albedo: this.getTexture(enemy.sprite.albedo.powerOfTwo),
        model,
        view,
        projection,
        viewport: shadowViewport,
      });
    }

    // Blur the shadows.
    for (let i = 0; i < 2; i++) {
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

    // Render the surface.
    this.regl.clear({ color: [0, 0, 0, 1], depth: 1 });
    this.renderSurface({
      offset: camPos,
      range: [fov.x, fov.y],
      viewport,
    });

    // Render the beams.
    this.tempBuffer1.reset();
    this.tempBuffer2.reset();
    for (const beam of state.beams) {
      if (beam.team === "player") {
        this.tempBuffer1.push(0.5, 1, 1, 1);
      } else {
        this.tempBuffer1.push(1, 1, 0.5, 1);
      }
      this.tempBuffer2.pushVec2(beam.lastPosition, beam.position);
    }

    this.renderLines({
      model: mat4.create(),
      view,
      projection,
      viewport,
      width: 0.02,
      colors: this.tempBuffer1.getBuffer(),
      points: this.tempBuffer2.getBuffer(),
      segments: state.beams.length,
      framebuffer: null,
    });

    // Render the enemies.
    for (const enemy of state.enemies) {
      mat4.identity(model);
      mat4.translate(model, model, [enemy.position[0], enemy.position[1], 0]);
      mat4.rotateZ(model, model, enemy.rotation);
      mat4.scale(model, model, [
        (enemy.sprite.scale * enemy.sprite.albedo.original.width) / enemy.sprite.albedo.original.height,
        enemy.sprite.scale,
        1,
      ]);
      this.renderSprite({
        albedo: this.getTexture(enemy.sprite.albedo.powerOfTwo),
        normal: this.getTexture(enemy.sprite.normal.powerOfTwo),
        rotation: enemy.rotation,
        model,
        view,
        projection,
        viewport,
      });
    }

    // Render enemy outlines.
    if (DEBUG) {
      for (const enemy of state.enemies) {
        this.tempBuffer1.reset();
        this.tempBuffer2.reset();
        for (let i = 0; i < enemy.sprite.outline!.length; i++) {
          const p0 = enemy.sprite.outline![i + 0];
          const p1 = enemy.sprite.outline![modulo(i + 1, enemy.sprite.outline!.length)];
          this.tempBuffer1.pushVec2(p0, p1);
          this.tempBuffer2.push(1, 1, 1, 1);
        }
        mat4.identity(model);
        mat4.translate(model, model, [enemy.position[0], enemy.position[1], 0]);
        mat4.rotateZ(model, model, enemy.rotation);
        this.renderLines({
          model,
          view,
          projection,
          viewport,
          width: 0.025,
          points: this.tempBuffer1.getBuffer(),
          colors: this.tempBuffer2.getBuffer(),
          segments: this.tempBuffer1.length / 4,
          framebuffer: null,
        });
      }
    }

    // Render the player.
    if (!state.player.dead) {
      mat4.identity(model);
      mat4.translate(model, model, [state.player.position[0], state.player.position[1], 0]);
      mat4.rotateZ(model, model, state.player.rotation);
      mat4.scale(model, model, [
        (state.player.sprite.scale * state.player.sprite.albedo.original.width) / state.player.sprite.albedo.original.height,
        state.player.sprite.scale,
        1,
      ]);
      this.renderSprite({
        albedo: this.getTexture(state.player.sprite.albedo.powerOfTwo),
        normal: this.getTexture(state.player.sprite.normal.powerOfTwo),
        rotation: state.player.rotation,
        model,
        view,
        projection,
        viewport,
      });
      for (const droid of state.player.droids) {
        mat4.identity(model);
        mat4.translate(model, model, [droid.position[0], droid.position[1], 0]);
        mat4.rotateZ(model, model, droid.rotation);
        mat4.scale(model, model, [
          (droid.sprite.scale * droid.sprite.albedo.original.width) / droid.sprite.albedo.original.height,
          droid.sprite.scale,
          1,
        ]);
        this.renderSprite({
          albedo: this.getTexture(droid.sprite.albedo.powerOfTwo),
          normal: this.getTexture(droid.sprite.normal.powerOfTwo),
          rotation: droid.rotation,
          model,
          view,
          projection,
          viewport,
        });
      }
    }

    // Render player outline.
    if (DEBUG) {
      this.tempBuffer1.reset();
      this.tempBuffer2.reset();
      for (let i = 0; i < state.player.sprite.outline!.length; i++) {
        const p0 = state.player.sprite.outline![i + 0];
        const p1 = state.player.sprite.outline![modulo(i + 1, state.player.sprite.outline!.length)];
        this.tempBuffer1.pushVec2(p0, p1);
        this.tempBuffer2.push(1, 1, 1, 1);
      }
      mat4.identity(model);
      mat4.translate(model, model, [state.player.position[0], state.player.position[1], 0]);
      mat4.rotateZ(model, model, state.player.rotation);
      this.renderLines({
        model,
        view,
        projection,
        viewport,
        width: 0.01,
        points: this.tempBuffer1.getBuffer(),
        colors: this.tempBuffer2.getBuffer(),
        segments: this.tempBuffer1.length / 4,
        framebuffer: null,
      });
    }

    // Render the sparks.
    this.tempBuffer1.reset();
    this.tempBuffer2.reset();
    for (const spark of state.sparks) {
      if (spark.source === "armor") {
        this.tempBuffer1.push(2 * spark.velocity, 1 * spark.velocity, 0.5 * spark.velocity, spark.velocity);
      } else {
        this.tempBuffer1.push(0.5 * spark.velocity, 1 * spark.velocity, 2.0 * spark.velocity, spark.velocity);
      }
      this.tempBuffer2.pushVec2(spark.lastPosition, spark.position);
    }
    this.renderLines({
      model: mat4.create(),
      view,
      projection,
      viewport,
      width: 0.02,
      colors: this.tempBuffer1.getBuffer(),
      points: this.tempBuffer2.getBuffer(),
      segments: state.sparks.length,
      framebuffer: null,
    });

    // Render the flames.
    this.tempBuffer1.reset();
    this.tempBuffer2.reset();
    this.tempBuffer3.reset();
    for (const flame of state.flames) {
      this.tempBuffer1.pushVec2(flame.position);
      this.tempBuffer2.push(flame.age);
      this.tempBuffer3.push(flame.scale);
    }
    this.renderFlame({
      points: this.tempBuffer1.getBuffer(),
      age: this.tempBuffer2.getBuffer(),
      scale: this.tempBuffer3.getBuffer(),
      instances: state.flames.length,
      view,
      projection,
      viewport,
    });

    // Render UI elements.

    // Armor and shield indicators.
    this.tempBuffer1.reset();
    this.tempBuffer2.reset();
    if (!state.player.dead) {
      arc(
        state.player.rotation,
        (0.5 * Math.PI * state.player.shields) / state.player.maxShields,
        state.player.sprite.radius * 1.1,
        state.player.position,
        [0, 0.5, 1.0, 1],
        this.tempBuffer1,
        this.tempBuffer2
      );
      arc(
        state.player.rotation,
        (0.5 * Math.PI * state.player.armor) / state.player.maxArmor,
        state.player.sprite.radius * 1.0,
        state.player.position,
        [0, 0.75, 0, 1],
        this.tempBuffer1,
        this.tempBuffer2
      );
    }

    for (const enemy of state.enemies) {
      const toPlayer = vec2.sub(vec2.create(), state.player.position, enemy.position);
      const angle = Math.atan2(toPlayer[1], toPlayer[0]);
      arc(
        angle,
        (0.5 * Math.PI * enemy.shields) / enemy.maxShields,
        enemy.sprite.radius * 1.1,
        enemy.position,
        [0, 0.5, 1.0, 1],
        this.tempBuffer1,
        this.tempBuffer2
      );
      arc(
        angle,
        (0.5 * Math.PI * enemy.armor) / enemy.maxArmor,
        enemy.sprite.radius * 1.0,
        enemy.position,
        [0, 0.75, 0, 1],
        this.tempBuffer1,
        this.tempBuffer2
      );
    }

    if (this.tempBuffer1.length > 0) {
      this.renderLines({
        model: mat4.create(),
        view,
        projection,
        viewport,
        width: 0.02,
        points: this.tempBuffer1.getBuffer(),
        colors: this.tempBuffer2.getBuffer(),
        segments: this.tempBuffer1.length / 4,
        framebuffer: null,
      });
    }

    // Render the direction indicator if needed.
    for (const enemy of state.enemies) {
      const dir = vec2.sub(vec2.create(), enemy.position, state.player.position);
      if (vec2.length(dir) < 5) {
        continue;
      }
      const rotation = Math.atan2(dir[1], dir[0]);
      this.renderDirection({
        resolution: [this.canvas.width, this.canvas.height],
        color: enemy.isCore ? [1, 1, 1] : [1, 0.5, 0.25],
        scale: enemy.isCore ? 1 : 0.75,
        time: performance.now() * 0.015,
        rotation,
        viewport,
      });
    }
  }
}

function arc(
  centerAngle: number,
  arcLength: number,
  radius: number,
  offset: vec2,
  color: number[],
  positionBuffer: SmartBuffer,
  colorArray: SmartBuffer
) {
  const count = 9;
  for (let i = 0; i < count; i++) {
    const theta0 = centerAngle - 0.5 * arcLength + (arcLength * (i + 0)) / count;
    const theta1 = centerAngle - 0.5 * arcLength + (arcLength * (i + 1)) / count;
    const x0 = radius * Math.cos(theta0) + offset[0];
    const y0 = radius * Math.sin(theta0) + offset[1];
    const x1 = radius * Math.cos(theta1) + offset[0];
    const y1 = radius * Math.sin(theta1) + offset[1];
    positionBuffer.push(x0, y0, x1, y1);
    colorArray.push(...color);
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
