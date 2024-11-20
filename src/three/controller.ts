/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="../../lib/three.d.ts" />
/// <reference path="../core/utils.ts" />

module BP3D.Three {
  /**
   * Handles user interactions with the 3D scene, including selection, dragging, 
   * rotating objects, and other mouse-based interactions.
   */
  export var Controller = function (
    three,
    model,
    camera,
    element,
    controls,
    hud
  ) {
    var scope = this;

    /** Whether the controller is active. */
    this.enabled = true;

    var scene = model.scene;

    var plane; // Ground plane used for intersection testing
    var mouse; // Mouse position in normalized device coordinates
    var intersectedObject; // Object currently under the mouse
    var mouseoverObject; // Object currently highlighted by the mouse
    var selectedObject; // Object currently selected by the user

    var mouseDown = false; // Whether the mouse is currently pressed
    var mouseMoved = false; // Tracks if the mouse moved since the last click

    var rotateMouseOver = false; // Tracks if the mouse is over a rotation handle

    /** Controller states for managing interactions. */
    var states = {
      UNSELECTED: 0, // No object selected
      SELECTED: 1, // Object selected but no interaction
      DRAGGING: 2, // Object being moved
      ROTATING: 3, // Object being rotated with the mouse pressed
      ROTATING_FREE: 4, // Object being rotated with the mouse released
      PANNING: 5, // Panning the camera
    };
    var state = states.UNSELECTED;

    /** Flag indicating if a visual update is needed. */
    this.needsUpdate = true;

    /**
     * Initializes event listeners, mouse tracking, and ground plane setup.
     */
    function init() {
      element.mousedown(mouseDownEvent);
      element.mouseup(mouseUpEvent);
      element.mousemove(mouseMoveEvent);

      mouse = new THREE.Vector2();

      scene.itemRemovedCallbacks.add(itemRemoved);
      scene.itemLoadedCallbacks.add(itemLoaded);
      setGroundPlane();
    }

    /**
     * Handles logic when an item is loaded into the scene.
     * @param item - The item being loaded.
     */
    function itemLoaded(item) {
      if (!item.position_set) {
        scope.setSelectedObject(item);
        switchState(states.DRAGGING);
        var pos = item.position.clone();
        pos.y = 0;
        var vec = three.projectVector(pos);
        clickPressed(vec);
      }
      item.position_set = true;
    }

    /**
     * Initiates an action on the selected object when the mouse is pressed.
     * @param vec2 - Optional mouse position in normalized device coordinates.
     */
    function clickPressed(vec2?) {
      vec2 = vec2 || mouse;
      var intersection = scope.itemIntersection(mouse, selectedObject);
      if (intersection) {
        selectedObject.clickPressed(intersection);
      }
    }

    /**
     * Handles dragging of the selected object.
     * @param vec2 - Optional mouse position in normalized device coordinates.
     */
    function clickDragged(vec2?) {
      vec2 = vec2 || mouse;
      var intersection = scope.itemIntersection(mouse, selectedObject);
      if (intersection) {
        if (scope.isRotating()) {
          selectedObject.rotate(intersection);
        } else {
          selectedObject.clickDragged(intersection);
        }
      }
    }

    /**
     * Handles cleanup when an item is removed from the scene.
     * @param item - The item being removed.
     */
    function itemRemoved(item) {
      if (item === selectedObject) {
        selectedObject.setUnselected();
        selectedObject.mouseOff();
        scope.setSelectedObject(null);
      }
    }

    /**
     * Sets up the ground plane used for object intersections.
     */
    function setGroundPlane() {
      var size = 10000;
      plane = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial()
      );
      plane.rotation.x = -Math.PI / 2;
      plane.visible = false;
      scene.add(plane);
    }

    /**
     * Checks for interactions with walls or floors when the mouse is clicked.
     * Triggers relevant callbacks for texture changes.
     */
    function checkWallsAndFloors() {
      if (state === states.UNSELECTED && mouseoverObject == null) {
        var wallEdgePlanes = model.floorplan.wallEdgePlanes();
        var wallIntersects = scope.getIntersections(mouse, wallEdgePlanes, true);

        if (wallIntersects.length > 0) {
          var wall = wallIntersects[0].object.edge;
          three.wallClicked.fire(wall);
          return;
        }

        var floorPlanes = model.floorplan.floorPlanes();
        var floorIntersects = scope.getIntersections(mouse, floorPlanes, false);

        if (floorIntersects.length > 0) {
          var room = floorIntersects[0].object.room;
          three.floorClicked.fire(room);
          return;
        }

        three.nothingClicked.fire();
      }
    }

    /**
     * Updates intersections and manages mouse movement events.
     * @param event - The mouse move event.
     */
    function mouseMoveEvent(event) {
      if (scope.enabled) {
        event.preventDefault();
        mouseMoved = true;

        mouse.x = event.clientX;
        mouse.y = event.clientY;

        if (!mouseDown) {
          updateIntersections();
        }

        switch (state) {
          case states.UNSELECTED:
          case states.SELECTED:
            updateMouseover();
            break;
          case states.DRAGGING:
          case states.ROTATING:
          case states.ROTATING_FREE:
            clickDragged();
            hud.update();
            scope.needsUpdate = true;
            break;
        }
      }
    }

    /**
     * Handles the mouse down event, managing object selection or rotation.
     * @param event - The mouse down event.
     */
    function mouseDownEvent(event) {
      if (scope.enabled) {
        event.preventDefault();
        mouseMoved = false;
        mouseDown = true;

        switch (state) {
          case states.SELECTED:
            if (rotateMouseOver) {
              switchState(states.ROTATING);
            } else if (intersectedObject) {
              scope.setSelectedObject(intersectedObject);
              if (!intersectedObject.fixed) {
                switchState(states.DRAGGING);
              }
            }
            break;
          case states.UNSELECTED:
            if (intersectedObject) {
              scope.setSelectedObject(intersectedObject);
              if (!intersectedObject.fixed) {
                switchState(states.DRAGGING);
              }
            }
            break;
        }
      }
    }

    /**
     * Handles the mouse up event, ending interactions like dragging or rotating.
     * @param event - The mouse up event.
     */
    function mouseUpEvent(event) {
      if (scope.enabled) {
        mouseDown = false;

        switch (state) {
          case states.DRAGGING:
            selectedObject.clickReleased();
            switchState(states.SELECTED);
            break;
          case states.ROTATING:
            switchState(mouseMoved ? states.SELECTED : states.ROTATING_FREE);
            break;
          case states.UNSELECTED:
            if (!mouseMoved) {
              checkWallsAndFloors();
            }
            break;
          case states.SELECTED:
            if (!mouseMoved && intersectedObject == null) {
              switchState(states.UNSELECTED);
              checkWallsAndFloors();
            }
            break;
        }
      }
    }

    /**
     * Switches the controller to a new interaction state.
     * @param newState - The new state to switch to.
     */
    function switchState(newState) {
      if (newState !== state) {
        onExit(state);
        onEntry(newState);
      }
      state = newState;
      hud.setRotating(scope.isRotating());
    }

    /**
     * Updates visual interactions when hovering over objects.
     */
    function updateMouseover() {
      if (intersectedObject) {
        if (mouseoverObject !== intersectedObject) {
          mouseoverObject?.mouseOff();
          mouseoverObject = intersectedObject;
          mouseoverObject.mouseOver();
          three.setCursorStyle("pointer");
          scope.needsUpdate = true;
        }
      } else if (mouseoverObject) {
        mouseoverObject.mouseOff();
        mouseoverObject = null;
        three.setCursorStyle("auto");
        scope.needsUpdate = true;
      }
    }

    init();
  };
}
