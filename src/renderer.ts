import { mat4 } from "gl-matrix";
import REGL, { Regl } from "regl";

import spriteShader from "./glsl/sprite.glsl?raw";
import { Resources } from "./resources";

export class Renderer {
  regl: Regl;
  renderSprite: REGL.DrawCommand;

  constructor(private canvas: HTMLCanvasElement, private resources: Resources) {
    this.regl = REGL({ canvas });

    const textures = {
      playerZero: this.regl.texture({ data: resources["ship0"].canvas, min: "linear mipmap linear", mag: "linear" }),
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

      count: 6,
      viewport: this.regl.prop<any, any>("viewport"),
    });
  }

  public render() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    const viewport = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };

    const model = mat4.create();
    mat4.rotateZ(model, model, performance.now() * 0.001);
    mat4.scale(model, model, [this.resources["ship0"].aspect, 1, 1]);
    const view = mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0]);
    const fovv = 1;
    const fovh = (fovv * this.canvas.width) / this.canvas.height;
    const projection = mat4.ortho(mat4.create(), -fovh, fovh, -fovv, fovv, 0, 1000);

    this.renderSprite({
      model,
      view,
      projection,
      viewport,
    });
  }
}
