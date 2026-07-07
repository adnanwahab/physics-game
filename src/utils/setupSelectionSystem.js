import { SelectionSystem } from "../modules/graphics/selectionSystem.js";

export function setupSelectionSystem(scene, camera, canvas, cleanupFunctions) {
  const selectionSystem = new SelectionSystem(scene, camera, canvas);
  let allowSelection = true;
  let mouseDownPos = null;

  const onPointerDown = (e) => {
    if (e.button === 0) {
      mouseDownPos = { x: e.clientX, y: e.clientY };
      allowSelection = true;
    }
  };
  const onPointerMove = (e) => {
    if (mouseDownPos && e.buttons === 1) {
      if (
        Math.abs(e.clientX - mouseDownPos.x) > 5 ||
        Math.abs(e.clientY - mouseDownPos.y) > 5
      )
        allowSelection = false;
    }
  };
  const onPointerUp = (e) => {
    if (e.button === 0 && allowSelection && mouseDownPos)
      setTimeout(() => selectionSystem.handleClick(e), 10);
    mouseDownPos = null;
    allowSelection = true;
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  cleanupFunctions.push(() => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    selectionSystem.dispose();
  });

  return selectionSystem;
}
