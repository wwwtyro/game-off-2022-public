export function imageDataGet(data: ImageData, x: number, y: number) {
  const offset = 4 * (y * data.width + x);
  return [data.data[offset + 0], data.data[offset + 1], data.data[offset + 2], data.data[offset + 3]];
}

export function imageDataSet(data: ImageData, x: number, y: number, value: number[]) {
  const offset = 4 * (y * data.width + x);
  data.data[offset + 0] = value[0];
  data.data[offset + 1] = value[1];
  data.data[offset + 2] = value[2];
  data.data[offset + 3] = value[3];
}
