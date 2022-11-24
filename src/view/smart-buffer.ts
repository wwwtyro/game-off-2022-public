import { vec2 } from "gl-matrix";
import { Buffer, Regl } from "regl";

export class SmartBuffer {
  private array = new Float32Array(1024);
  private buffer: Buffer;
  private index = 0;

  constructor(regl: Regl) {
    this.buffer = regl.buffer({ length: 1, usage: "dynamic", type: "float32" });
  }

  public push(...values: number[]) {
    while (this.array.length <= this.index + values.length) {
      const newArray = new Float32Array(this.array.length * 2);
      newArray.set(this.array);
      this.array = newArray;
    }
    for (const value of values) {
      this.array[this.index] = value;
      this.index++;
    }
  }

  public pushVec2(...values: vec2[]) {
    for (const value of values) {
      this.push(value[0], value[1]);
    }
  }

  public reset() {
    this.index = 0;
  }

  public getBuffer() {
    this.buffer({
      data: this.array,
      length: this.index * 4,
    });
    return this.buffer;
  }

  public get length() {
    return this.index;
  }
}
