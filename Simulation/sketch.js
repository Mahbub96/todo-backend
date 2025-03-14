let sun, earth;
let G = 0.2;
let orbitPath = [];
let grid = [];
let gridSpacing = 50;
let curvatureIntensity = 0.3;
let barycenter;
let deltaTime = 0.1;

function setup() {
  createCanvas(1200, 800, WEBGL);
  angleMode(DEGREES);

  sun = {
    position: createVector(0, 0),
    mass: 50000,
    radius: 40,
    velocity: createVector(0, 0),
  };

  earth = {
    position: createVector(300, 0),
    mass: 1000,
    radius: 8,
    velocity: createVector(0, 3.4),
  };

  createGrid();
  noStroke();
  calculateBarycenter();
}

function calculateBarycenter() {
  const totalMass = sun.mass + earth.mass;
  const bx =
    (sun.mass * sun.position.x + earth.mass * earth.position.x) / totalMass;
  barycenter = createVector(bx, 0);
}

function createGrid() {
  grid = [];
  const range = 600;
  for (let x = -range; x <= range; x += gridSpacing) {
    let col = [];
    for (let y = -range; y <= range; y += gridSpacing) {
      col.push(createVector(x, y, 0));
    }
    grid.push(col);
  }
}

function draw() {
  background(0);
  lights();
  orbitControl(1, 1, 0.1);

  // Adjust camera view
  translate(-width / 4, -height / 4);
  scale(1);

  updateSystem();
  drawSpacetimeFabric();
  drawCelestialBodies();
  drawBarycenter();
}

function updateSystem() {
  const forceDirection = p5.Vector.sub(sun.position, earth.position);
  const distance = forceDirection.mag();
  forceDirection.normalize();
  const strength = (G * sun.mass * earth.mass) / (distance * distance);
  const force = forceDirection.mult(strength);

  // Fixed syntax for velocity updates
  sun.velocity.sub(p5.Vector.div(force, sun.mass).mult(deltaTime));
  earth.velocity.add(p5.Vector.div(force, earth.mass).mult(deltaTime));

  sun.position.add(p5.Vector.mult(sun.velocity, deltaTime));
  earth.position.add(p5.Vector.mult(earth.velocity, deltaTime));

  if (distance < sun.radius + earth.radius) {
    noLoop();
    console.log("Collision!");
  }

  calculateBarycenter();
  orbitPath.push(p5.Vector.sub(earth.position, barycenter).copy());
  if (orbitPath.length > 500) orbitPath.shift();

  updateSpacetimeCurvature();
}

function updateSpacetimeCurvature() {
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      const point = grid[x][y];
      const dSun = dist(point.x, point.y, sun.position.x, sun.position.y);
      const dEarth = dist(point.x, point.y, earth.position.x, earth.position.y);

      point.z =
        (-curvatureIntensity * sun.mass) / (dSun + 50) -
        (curvatureIntensity * earth.mass) / (dEarth + 150);
    }
  }
}

function drawSpacetimeFabric() {
  stroke(100, 200, 255, 100);
  strokeWeight(1);
  noFill();

  for (let x = 0; x < grid.length - 1; x++) {
    for (let y = 0; y < grid[x].length - 1; y++) {
      beginShape();
      vertex(grid[x][y].x, grid[x][y].y, grid[x][y].z * 300);
      vertex(grid[x + 1][y].x, grid[x + 1][y].y, grid[x + 1][y].z * 300);
      vertex(
        grid[x + 1][y + 1].x,
        grid[x + 1][y + 1].y,
        grid[x + 1][y + 1].z * 300
      );
      vertex(grid[x][y + 1].x, grid[x][y + 1].y, grid[x][y + 1].z * 300);
      endShape(CLOSE);
    }
  }
}

function drawCelestialBodies() {
  // Sun
  push();
  translate(sun.position.x, sun.position.y, 0);
  emissiveMaterial(255, 204, 0);
  pointLight(255, 204, 0, 0, 0, 0);
  sphere(sun.radius);
  pop();

  // Earth
  push();
  translate(earth.position.x, earth.position.y, 0);
  emissiveMaterial(100, 150, 255);
  sphere(earth.radius);
  pop();

  // Orbit path
  drawOrbitPath();
}

function drawBarycenter() {
  push();
  translate(barycenter.x, barycenter.y, 0);
  emissiveMaterial(255, 0, 0);
  sphere(6);
  pop();
}

function drawOrbitPath() {
  noFill();
  stroke(0, 255, 100);
  strokeWeight(2);
  beginShape();
  orbitPath.forEach((pos) => {
    const absPos = p5.Vector.add(barycenter, pos);
    vertex(absPos.x, absPos.y);
  });
  endShape();
}
