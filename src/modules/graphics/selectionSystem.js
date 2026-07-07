import * as THREE from 'three';

/**
 * Selection system for highlighting clicked objects
 */
export class SelectionSystem {
  constructor(scene, camera, canvas) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedObject = null;
    this.originalMaterials = new Map(); // Store original materials
    this.highlightMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });
  }

  /**
   * Handle mouse click and select/deselect objects
   */
  handleClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all selectable objects (meshes with userData.body)
    const selectableObjects = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData && object.userData.body) {
        selectableObjects.push(object);
      } else if (object instanceof THREE.Group && object.userData && object.userData.body) {
        // For groups (like the penguin), check all children
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            selectableObjects.push(child);
          }
        });
      }
    });

    // Find intersections
    const intersects = this.raycaster.intersectObjects(selectableObjects, true);

    if (intersects.length > 0) {
      // Find the top-level object (group or mesh) that was clicked
      let clickedObject = intersects[0].object;
      
      // Traverse up to find the object with userData.body
      // This could be a Mesh, Group, or any parent with the body reference
      while (clickedObject) {
        if (clickedObject.userData && clickedObject.userData.body) {
          break;
        }
        if (clickedObject.parent) {
          clickedObject = clickedObject.parent;
        } else {
          clickedObject = null;
          break;
        }
      }

      if (clickedObject && clickedObject.userData && clickedObject.userData.body) {
        this.selectObject(clickedObject);
      } else {
        this.deselectObject();
      }
    } else {
      // Clicked on nothing, deselect
      this.deselectObject();
    }
  }

  /**
   * Select an object and highlight it in red
   */
  selectObject(object) {
    // Deselect previous object if any
    if (this.selectedObject && this.selectedObject !== object) {
      this.deselectObject();
    }

    this.selectedObject = object;
    
    // Store and replace materials
    if (object instanceof THREE.Mesh) {
      // Single mesh - handle both single material and material arrays
      if (!this.originalMaterials.has(object)) {
        this.originalMaterials.set(object, Array.isArray(object.material) 
          ? [...object.material] 
          : object.material);
      }
      object.material = Array.isArray(object.material)
        ? object.material.map(() => this.highlightMaterial.clone())
        : this.highlightMaterial.clone();
    } else if (object instanceof THREE.Group) {
      // Group - highlight all meshes in the group
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (!this.originalMaterials.has(child)) {
            this.originalMaterials.set(child, Array.isArray(child.material)
              ? [...child.material]
              : child.material);
          }
          child.material = Array.isArray(child.material)
            ? child.material.map(() => this.highlightMaterial.clone())
            : this.highlightMaterial.clone();
        }
      });
    }
  }

  /**
   * Deselect the current object and restore original materials
   */
  deselectObject() {
    if (!this.selectedObject) return;

    if (this.selectedObject instanceof THREE.Mesh) {
      // Restore original material
      const originalMaterial = this.originalMaterials.get(this.selectedObject);
      if (originalMaterial) {
        this.selectedObject.material = originalMaterial;
        this.originalMaterials.delete(this.selectedObject);
      }
    } else if (this.selectedObject instanceof THREE.Group) {
      // Restore materials for all meshes in the group
      this.selectedObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const originalMaterial = this.originalMaterials.get(child);
          if (originalMaterial) {
            child.material = originalMaterial;
            this.originalMaterials.delete(child);
          }
        }
      });
    }

    this.selectedObject = null;
  }

  /**
   * Get the currently selected object
   */
  getSelectedObject() {
    return this.selectedObject;
  }

  /**
   * Cleanup - remove event listeners and restore materials
   */
  dispose() {
    this.deselectObject();
    this.originalMaterials.clear();
  }
}

