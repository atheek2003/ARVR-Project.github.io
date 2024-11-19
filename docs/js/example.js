/*
 * Camera Buttons
 */
var CameraButtons = function(blueprint3d) {
  var orbitControls = blueprint3d.three.controls;
  var three = blueprint3d.three;

  var panSpeed = 30;
  var directions = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
  }

  function init() {
    $("#zoom-in").click(zoomIn);
    $("#zoom-out").click(zoomOut);
    $("#zoom-in").dblclick(preventDefault);
    $("#zoom-out").dblclick(preventDefault);

    $("#reset-view").click(three.centerCamera);

    $("#move-left").click(() => pan(directions.LEFT));
    $("#move-right").click(() => pan(directions.RIGHT));
    $("#move-up").click(() => pan(directions.UP));
    $("#move-down").click(() => pan(directions.DOWN));

    $("#move-left").dblclick(preventDefault);
    $("#move-right").dblclick(preventDefault);
    $("#move-up").dblclick(preventDefault);
    $("#move-down").dblclick(preventDefault);
  }

  function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function pan(direction) {
    switch (direction) {
      case directions.UP:
        orbitControls.panXY(0, panSpeed);
        break;
      case directions.DOWN:
        orbitControls.panXY(0, -panSpeed);
        break;
      case directions.LEFT:
        orbitControls.panXY(panSpeed, 0);
        break;
      case directions.RIGHT:
        orbitControls.panXY(-panSpeed, 0);
        break;
    }
  }

  function zoomIn(e) {
    e.preventDefault();
    orbitControls.dollyIn(1.1);
    orbitControls.update();
  }

  function zoomOut(e) {
    e.preventDefault();
    orbitControls.dollyOut(1.1);
    orbitControls.update();
  }

  init();
}

/*
 * FPP View
 */
var FPPView = {
  active: false,
  height: 170, // Camera height in cm
  moveSpeed: 5,
  rotateSpeed: Math.PI / 180, // 1 degree in radians

  init: function(blueprint3d) {
    this.blueprint3d = blueprint3d;
    this.three = blueprint3d.three;

    $('#toggle-fpp').click((e) => {
      e.preventDefault();
      this.toggleFPP();
    });

    $(document).on('keydown', (e) => {
      if (!this.active) return;
      switch (e.which) {
        case 87: this.moveForward(); break; // W
        case 83: this.moveBackward(); break; // S
        case 65: this.moveLeft(); break; // A
        case 68: this.moveRight(); break; // D
        case 81: this.rotateLeft(); break; // Q
        case 69: this.rotateRight(); break; // E
      }
    });
  },

  toggleFPP: function() {
    this.active = !this.active;
    $('#toggle-fpp').toggleClass('btn-primary', this.active);

    if (this.active) {
      this.enterFPPMode();
    } else {
      this.exitFPPMode();
    }
  },

  enterFPPMode: function() {
    var camera = this.three.camera;
    camera.position.y = this.height / 100; // Convert cm to meters
    camera.lookAt(0, this.height / 100, 0);
    this.three.controls.enabled = false;
  },

  exitFPPMode: function() {
    this.three.controls.enabled = true;
    this.blueprint3d.three.updateWindowSize();
  },

  moveForward: function() {
    var camera = this.three.camera;
    camera.translateZ(-this.moveSpeed / 100);
  },

  moveBackward: function() {
    var camera = this.three.camera;
    camera.translateZ(this.moveSpeed / 100);
  },

  moveLeft: function() {
    var camera = this.three.camera;
    camera.translateX(-this.moveSpeed / 100);
  },

  moveRight: function() {
    var camera = this.three.camera;
    camera.translateX(this.moveSpeed / 100);
  },

  rotateLeft: function() {
    var camera = this.three.camera;
    camera.rotateY(this.rotateSpeed);
  },

  rotateRight: function() {
    var camera = this.three.camera;
    camera.rotateY(-this.rotateSpeed);
  }
};

/*
 * Initialize!
 */
$(document).ready(function() {
  var opts = {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    threeCanvasElement: 'three-canvas',
    textureDir: "models/textures/",
    widget: false
  };
  
  var blueprint3d = new BP3D.Blueprint3d(opts);

  var modalEffects = new ModalEffects(blueprint3d);
  var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
  var contextMenu = new ContextMenu(blueprint3d);
  var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
  var textureSelector = new TextureSelector(blueprint3d, sideMenu);        
  var cameraButtons = new CameraButtons(blueprint3d);
  FPPView.init(blueprint3d);
  mainControls(blueprint3d);

  blueprint3d.model.loadSerialized('{"floorplan":{"corners":{},"walls":[],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}}, "items":[]}');
});
