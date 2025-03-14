let sun, earth;
let G = 6.674e-11; // Real gravitational constant
let scaleFactor = 1e-9; // Scale down for visualization
let orbitPath = [];
let maxOrbitPoints = 500;

function setup() {
  createCanvas(1200, 800, WEBGL);

  // Initialize celestial bodies with real scale (adjusted for visualization)
  sun = {
    position: createVector(0, 0),
    mass: 1.989e30 * scaleFactor,
    radius: 20,
  };

  earth = {
    position: createVector(147.1e9 * scaleFactor, 0), // Perihelion distance
    velocity: createVector(0, 30.29e3 * scaleFactor), // Orbital velocity
    mass: 5.972e24 * scaleFactor,
    radius: 8,
  };

  createSliders();
  createGrid();
}

function draw() {
  background(0);
  orbitControl();

  // Update parameters
  sun.mass = sunMassSlider.value() * 1e30 * scaleFactor;
  earth.mass = earthMassSlider.value() * 1e24 * scaleFactor;

  calculateRelativisticOrbit();
  updateSpacetimeGrid();

  drawSpacetimeFabric();
  drawOrbitPath();
  drawCelestialBodies();
}

function calculateRelativisticOrbit() {
  // Schwarzschild metric-inspired calculation
  let r = p5.Vector.sub(sun.position, earth.position);
  let distance = r.mag();
  let c = 299792458 * scaleFactor; // Scaled speed of light

  // Proper relativistic acceleration
  let acceleration = r
    .copy()
    .normalize()
    .mult(
      (G * sun.mass * (1 + (3 * earth.velocity.magSq()) / (c * c))) /
        (distance * distance)
    );

  // Verlet integration with velocity
  let prevPosition = earth.position.copy();
  earth.position.add(p5.Vector.add(earth.velocity, acceleration.mult(0.5)));
  earth.velocity.add(acceleration);

  // Store orbit path
  orbitPath.push(earth.position.copy());
  if (orbitPath.length > maxOrbitPoints) orbitPath.shift();
}

function updateSpacetimeGrid() {
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      let point = grid[x][y];
      let sunDist = dist(point.x, point.y, sun.position.x, sun.position.y);
      let earthDist = dist(
        point.x,
        point.y,
        earth.position.x,
        earth.position.y
      );

      // Schwarzschild radius-based curvature
      let sunRs = (2 * G * sun.mass) / (1 * scaleFactor);
      let earthRs = (2 * G * earth.mass) / (1 * scaleFactor);

      // Combined spacetime curvature (metric tensor component)
      point.z = -sunRs / (sunDist + 1e-5) - earthRs / (earthDist + 1e-5);
    }
  }
}

function drawSpacetimeFabric() {
  noFill();
  stroke(70, 130, 200);

  // Draw warped grid
  for (let x = 0; x < grid.length - 1; x++) {
    for (let y = 0; y < grid[x].length - 1; y++) {
      beginShape();
      vertex(grid[x][y].x, grid[x][y].y, grid[x][y].z * 1000);
      vertex(grid[x + 1][y].x, grid[x + 1][y].y, grid[x + 1][y].z * 1000);
      vertex(
        grid[x + 1][y + 1].x,
        grid[x + 1][y + 1].y,
        grid[x + 1][y + 1].z * 1000
      );
      vertex(grid[x][y + 1].x, grid[x][y + 1].y, grid[x][y + 1].z * 1000);
      endShape(CLOSE);
    }
  }
}

function drawOrbitPath() {
  // Draw orbital path
  noFill();
  stroke(0, 255, 100);
  beginShape();
  for (let pos of orbitPath) {
    vertex(pos.x, pos.y, pos.z);
  }
  endShape();
}

function createGrid() {
  grid = [];
  let gridSize = 50;
  let range = 400;
  for (let x = -range; x <= range; x += gridSize) {
    let col = [];
    for (let y = -range; y <= range; y += gridSize) {
      col.push(createVector(x, y, 0));
    }
    grid.push(col);
  }
}

function createSliders() {
  sunMassSlider = createSlider(0.5, 3.0, 1.0, 0.1);
  sunMassSlider.position(20, 20);
  earthMassSlider = createSlider(0.1, 5.0, 1.0, 0.1);
  earthMassSlider.position(20, 50);
}

function drawCelestialBodies() {
  // Draw Sun with gravitational lensing effect
  push();
  translate(sun.position.x, sun.position.y, 50);
  emissiveMaterial(255, 204, 0);
  sphere(sun.radius);

  // Gravitational lensing rings
  noFill();
  stroke(255, 150, 0, 100);
  for (let i = 1; i <= 3; i++) {
    ellipse(0, 0, sun.radius * i * 5, sun.radius * i * 5);
  }
  pop();

  // Draw Earth with proper motion
  push();
  translate(earth.position.x, earth.position.y, 50);
  emissiveMaterial(100, 150, 255);
  sphere(earth.radius);
  pop();
}
