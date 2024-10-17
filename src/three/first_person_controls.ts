import * as THREE from 'three';

class FirstPersonControls extends THREE.EventDispatcher {
  constructor(camera, domElement) {
    super();
    this.camera = camera;
    this.domElement = domElement;

    this.movementSpeed = 1.0;
    this.lookSpeed = 0.005;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.lat = 0;
    this.lon = 0;
    this.phi = 0;
    this.theta = 0;

    this.mouseX = 0;
    this.mouseY = 0;

    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    this.domElement.addEventListener('keydown', this.onKeyDown.bind(this), false);
    this.domElement.addEventListener('keyup', this.onKeyUp.bind(this), false);
  }

  onMouseMove(event) {
    this.mouseX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    this.mouseY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
  }

  onKeyDown(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        this.moveForward = true;
        break;
      case 37: // left
      case 65: // a
        this.moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        this.moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        this.moveRight = true;
        break;
    }
  }

  onKeyUp(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        this.moveForward = false;
        break;
      case 37: // left
      case 65: // a
        this.moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        this.moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        this.moveRight = false;
        break;
    }
  }

  update(delta) {
    const moveSpeed = delta * this.movementSpeed;

    if (this.moveForward) this.camera.translateZ(-moveSpeed);
    if (this.moveBackward) this.camera.translateZ(moveSpeed);
    if (this.moveLeft) this.camera.translateX(-moveSpeed);
    if (this.moveRight) this.camera.translateX(moveSpeed);

    this.lon += this.mouseX * this.lookSpeed;
    this.lat -= this.mouseY * this.lookSpeed;

    this.lat = Math.max(-85, Math.min(85, this.lat));
    this.phi = THREE.Math.degToRad(90 - this.lat);
    this.theta = THREE.Math.degToRad(this.lon);

    const targetPosition = new THREE.Vector3();
    targetPosition.x = this.camera.position.x + 100 * Math.sin(this.phi) * Math.cos(this.theta);
    targetPosition.y = this.camera.position.y + 100 * Math.cos(this.phi);
    targetPosition.z = this.camera.position.z + 100 * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.lookAt(targetPosition);

    this.mouseX = 0;
    this.mouseY = 0;
  }
}

export { FirstPersonControls };
