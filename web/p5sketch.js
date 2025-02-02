// p5.js sketch for a premium animated background
let x = 0;
function setup() {
  let canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.parent("canvas-container");
  clear();
}

function draw() {
  clear();
  noStroke();
  fill(0, 123, 255, 20);
  let size = 60 + 20 * sin(frameCount * 0.05);
  ellipse(x, height / 2, size, size);
  x = (x + 1.5) % width;
}
