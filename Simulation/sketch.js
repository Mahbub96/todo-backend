let sun, earth;
let G = 0.2;
let orbitPath = [];
let grid = [];
let gridSpacing = 30;
let curvatureIntensity = 0.1;
let barycenter;

function setup() {
  createCanvas(1200, 800, WEBGL);

  // Initialize realistic masses (Sun: 99.97% of system mass)
  sun = {
    position: createVector(0, 0),
    mass: 50000, // ~333,000 Earth masses
    radius: 40,
    velocity: createVector(0, 0),
  };

  earth = {
    position: createVector(300, 0),
    mass: 1,
    radius: 5,
    velocity: createVector(0, 3),
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
  const range = 1200;
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

  updateSystem();
  drawSpacetimeFabric();
  drawCelestialBodies();
  drawBarycenter();
}

function updateSystem() {
  // Calculate gravitational force
  const force = p5.Vector.sub(earth.position, sun.position);
  const distance = force.mag();
  force.normalize();
  const strength = (G * sun.mass * earth.mass) / (distance * distance);
  force.mult(strength);

  // Update velocities for both bodies
  sun.velocity.add(p5.Vector.div(force, sun.mass));
  earth.velocity.sub(p5.Vector.div(force, earth.mass));

  // Update positions
  sun.position.add(sun.velocity);
  earth.position.add(earth.velocity);

  // Track orbit relative to barycenter
  calculateBarycenter();
  orbitPath.push(p5.Vector.sub(earth.position, barycenter));
  if (orbitPath.length > 500) orbitPath.shift();

  updateSpacetimeCurvature();
}

function updateSpacetimeCurvature() {
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      const point = grid[x][y];
      const dSun = dist(point.x, point.y, sun.position.x, sun.position.y);
      const dEarth = dist(point.x, point.y, earth.position.x, earth.position.y);

      // Combined spacetime curvature from both masses
      point.z =
        (-curvatureIntensity * sun.mass) / (dSun + 50) -
        (curvatureIntensity * earth.mass * 100) / (dEarth + 150);
    }
  }
}

function drawSpacetimeFabric() {
  stroke(100, 150, 255, 50);
  noFill();
  for (let x = 0; x < grid.length - 1; x++) {
    for (let y = 0; y < grid[x].length - 1; y++) {
      beginShape();
      vertex(grid[x][y].x, grid[x][y].y, grid[x][y].z * 200);
      vertex(grid[x + 1][y].x, grid[x + 1][y].y, grid[x + 1][y].z * 200);
      vertex(
        grid[x + 1][y + 1].x,
        grid[x + 1][y + 1].y,
        grid[x + 1][y + 1].z * 200
      );
      vertex(grid[x][y + 1].x, grid[x][y + 1].y, grid[x][y + 1].z * 200);
      endShape(CLOSE);
    }
  }
}

function drawCelestialBodies() {
  // Draw Sun (offset from center)
  push();
  translate(sun.position.x, sun.position.y, 50);
  emissiveMaterial(255, 204, 0);
  sphere(sun.radius);
  pop();

  // Draw Earth (offset from center)
  push();
  translate(earth.position.x, earth.position.y, 50);
  emissiveMaterial(0, 100, 255);
  sphere(earth.radius);
  pop();

  // Draw orbital path
  drawOrbitPath();
}

function drawBarycenter() {
  push();
  translate(barycenter.x, barycenter.y, 50);
  emissiveMaterial(255, 0, 0);
  sphere(5);
  pop();
}

function drawOrbitPath() {
  noFill();
  stroke(0, 255, 100);
  beginShape();
  orbitPath.forEach((pos) => {
    const absPos = p5.Vector.add(barycenter, pos);
    vertex(absPos.x, absPos.y);
  });
  endShape();
}
