/// <reference path="model/model.ts" />
/// <reference path="floorplanner/floorplanner.ts" />
/// <reference path="three/main.ts" />

module BP3D {
  /**
   * Configuration options for initializing the Blueprint3D application.
   */
  export interface Options {
    /** Whether to initialize the application in widget mode. */
    widget?: boolean;

    /** The DOM element ID for the Three.js container. */
    threeElement?: string;

    /** The DOM element ID for the Three.js canvas. */
    threeCanvasElement?: string;

    /** The DOM element ID for the floorplanner container. */
    floorplannerElement?: string;

    /** The directory path for loading textures. */
    textureDir?: string;
  }

  /**
   * Core application class for Blueprint3D, handling the 3D visualization and floor planning.
   */
  export class Blueprint3d {
    
    /** The data model representing the 3D floorplan and objects. */
    private model: Model.Model;

    /** The Three.js main handler for rendering 3D scenes. */
    private three: any; // Placeholder for Three.Main;

    /** The floor planner interface for creating and editing floor plans. */
    private floorplanner: Floorplanner.Floorplanner;

    /**
     * Initializes a new instance of the Blueprint3D application.
     * 
     * @param options - Configuration options for the application.
     */
    constructor(options: Options) {
      // Initialize the 3D model with the provided texture directory.
      this.model = new Model.Model(options.textureDir);

      // Set up the Three.js visualization module.
      this.three = new Three.Main(
        this.model, 
        options.threeElement, 
        options.threeCanvasElement, 
        {}
      );

      // Set up the floor planner if not in widget mode.
      if (!options.widget) {
        this.floorplanner = new Floorplanner.Floorplanner(
          options.floorplannerElement, 
          this.model.floorplan
        );
      } else {
        // Disable the Three.js controller in widget mode.
        this.three.getController().enabled = false;
      }
    }
  }
}
