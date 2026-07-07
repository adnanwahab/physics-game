import * as THREE from "three";
import { loadOBJModel } from "./obj-loader.js";
import deskObjUrl from "../obj/desk.obj?url";
import sittingPersonObjUrl from "../obj/sitting_person.obj?url";
import { createBox } from "./createBox.js";
import { addToScene } from "./addToScene.js";
import { getThreeObjectForBody } from "./getThreeObjectForBody.js";
import { createSoundWaveRings } from "../modules/graphics/createSoundWaveRings.js";

function quatFromEulerArray(arr) {
  const euler = new THREE.Euler(arr[0], arr[1], arr[2], "XYZ");
  const q = new THREE.Quaternion();
  q.setFromEuler(euler);
  return q;
}

async function loadLevelCuboids(
  levelId,
  Jolt,
  bodyInterface,
  scene,
  dynamicObjects,
) {
  let cheesePosition = null;
  const effectUpdaters = [];
  const effectDisposers = [];
  try {
    const levelModule = await import(`../levels/${levelId}.json`);
    const levelData = levelModule.default || levelModule;
    if (levelData && levelData.length > 0 && levelData[0].objects) {
      const objects = levelData[0].objects;

      const redMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        metalness: 0.3,
        roughness: 0.7,
      });
      const cheeseMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3,
      });
      const deskMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        metalness: 0.1,
        roughness: 0.8,
      });
      const personMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a6fa5,
        metalness: 0.1,
        roughness: 0.7,
      });
      const LAYER_NON_MOVING = 0;

      for (let index = 0; index < objects.length; index++) {
        const obj = objects[index];
        const forcedRotation =
          index === 2 && obj.type === "cuboid" ? [0, Math.PI / 2, 0] : null;

        if (obj.type === "desk") {
          const halfExtent = new Jolt.Vec3(
            obj.size[0] / 2,
            obj.size[1] / 2,
            obj.size[2] / 2,
          );
          const position = new Jolt.RVec3(
            obj.position[0],
            obj.position[1],
            obj.position[2],
          );
          let rotation;
          if (
            obj.rotation[0] === 0 &&
            obj.rotation[1] === 0 &&
            obj.rotation[2] === 0
          ) {
            rotation = Jolt.Quat.prototype.sIdentity();
          } else {
            const q = quatFromEulerArray(obj.rotation);
            rotation = new Jolt.Quat(q.x, q.y, q.z, q.w);
          }
          createBox(
            Jolt,
            bodyInterface,
            async (body) => {
              const placeholder = addToScene(
                body,
                Jolt,
                bodyInterface,
                scene,
                dynamicObjects,
                getThreeObjectForBody,
              );
              try {
                const desk = await loadOBJModel(deskObjUrl);
                desk.traverse((child) => {
                  if (child.isMesh) {
                    child.material = deskMaterial;
                    child.geometry.translate(0, -obj.size[1] / 2, 0);
                  }
                });
                desk.position.copy(placeholder.position);
                desk.quaternion.copy(placeholder.quaternion);
                desk.userData.body = body;
                scene.remove(placeholder);
                const pi = dynamicObjects.indexOf(placeholder);
                if (pi > -1) dynamicObjects[pi] = desk;
                const soundWaves = createSoundWaveRings({
                  position: new THREE.Vector3(0, obj.size[1] / 2 + 0.02, 0),
                  maxRadius: 3.5,
                  speed: 1.5,
                });
                desk.add(soundWaves.group);
                effectUpdaters.push(soundWaves.update);
                effectDisposers.push(soundWaves.dispose);
                const person = await loadOBJModel(sittingPersonObjUrl);
                person.traverse((child) => {
                  if (child.isMesh) child.material = personMaterial;
                });
                person.position.set(0, obj.size[1] / 2 - 0.75, -0.15);
                desk.add(person);
                scene.add(desk);
              } catch (error) {
                console.error("Error loading desk model:", error);
              }
            },
            position,
            rotation,
            halfExtent,
            Jolt.EMotionType_Static,
            LAYER_NON_MOVING,
          );
          continue;
        }

        if (obj.type === "cuboid" || obj.type === "cheese") {
          const halfExtent = new Jolt.Vec3(
            obj.size[0] / 2,
            obj.size[1] / 2,
            obj.size[2] / 2,
          );
          const position = new Jolt.RVec3(
            obj.position[0],
            obj.position[1],
            obj.position[2],
          );
          let rotation;
          if (forcedRotation) {
            const q = quatFromEulerArray(forcedRotation);
            rotation = new Jolt.Quat(q.x, q.y, q.z, q.w);
          } else if (
            obj.rotation[0] === 0 &&
            obj.rotation[1] === 0 &&
            obj.rotation[2] === 0
          ) {
            rotation = Jolt.Quat.prototype.sIdentity();
          } else {
            const q = quatFromEulerArray(obj.rotation);
            rotation = new Jolt.Quat(q.x, q.y, q.z, q.w);
          }
          if (obj.type === "cheese")
            cheesePosition = new THREE.Vector3(
              obj.position[0],
              obj.position[1],
              obj.position[2],
            );
          const material = obj.type === "cheese" ? cheeseMaterial : redMaterial;
          createBox(
            Jolt,
            bodyInterface,
            (body) =>
              addToScene(
                body,
                Jolt,
                bodyInterface,
                scene,
                dynamicObjects,
                getThreeObjectForBody,
                material,
              ),
            position,
            rotation,
            halfExtent,
            Jolt.EMotionType_Static,
            LAYER_NON_MOVING,
          );
        }
      }
    }
  } catch (error) {
    console.error("Error loading level cuboids:", error);
  }
  return { cheesePosition, effectUpdaters, effectDisposers };
}

export default loadLevelCuboids;
