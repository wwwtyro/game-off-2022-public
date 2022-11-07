export function animationFrame() {
  return new Promise((accept) => {
    requestAnimationFrame(accept);
  });
}

export function modulo(n: number, m: number) {
  return ((n % m) + m) % m;
}
