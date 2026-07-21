import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
console.log("api key ", process.env.GEMINI_API_KEY);
// 1. Initialize the Gemini SDK (automatically picks up GEMINI_API_KEY from environment variables)
// 1. Initialize the Gemini SDK properly by nesting the config inside options
const ai = new GoogleGenAI({
  options: {
    apiKey: process.env.GEMINI_API_KEY,
  },
});
// Your input data list
const data = [
  {
    slide: 1,
    theme: "HappyBearLandia",
    suggested_image:
      "Fantasy world map with glowing cities and interconnected paths",
  },
  {
    slide: 2,
    theme: "Table of Contents",
    suggested_image: "Stylized roadmap with chapter milestones",
  },
  {
    slide: 4,
    theme: "Deliverables",
    suggested_image:
      "Vision board collage showing improved relationships, collaboration, and goals",
  },
  {
    slide: 11,
    theme: "Central Hypothesis",
    suggested_image:
      "Large feedback loop diagram connecting people, data, and outcomes",
  },
  {
    slide: 12,
    theme: "Cat reinforces happiness",
    suggested_image:
      "Person interacting with a cat, with branching neural-path overlays",
  },
  {
    slide: 13,
    theme: "Design / choices through time",
    suggested_image: "Branching timeline tree with alternate futures",
  },
  {
    slide: 14,
    theme: "Sim to Reality",
    suggested_image: "Digital twin city transitioning into a real city",
  },
  {
    slide: 15,
    theme: "Games are simulations",
    suggested_image:
      "Split-screen showing game world and real world mirroring each other",
  },
  {
    slide: 17,
    theme: "Measure 12 goals daily",
    suggested_image: "Dashboard with 12 gauges arranged in a circle",
  },
  {
    slide: 18,
    theme: "Dynamic Vis",
    suggested_image:
      "Particle network converging toward a central glowing node",
  },
  {
    slide: 19,
    theme: "Golden vs Rainbow truth",
    suggested_image: "Golden beam versus rainbow spectrum merging together",
  },
  {
    slide: 22,
    theme: "Therapy Scene 1",
    suggested_image:
      "Giant tree growing from life experiences represented as branches",
  },
  {
    slide: 28,
    theme: "Values",
    suggested_image:
      "Compass with Peace, Love, Unity, and Respect as cardinal directions",
  },
  {
    slide: 30,
    theme: "Archimonde with Therapy",
    suggested_image: "Fantasy wizard transforming dark energy into light",
  },
  {
    slide: 38,
    theme: "Rights",
    suggested_image: "Scale of justice surrounded by interconnected citizens",
  },
  {
    slide: 40,
    theme: "Energy",
    suggested_image:
      "Clean-energy landscape combining solar, wind, and nuclear power",
  },
  {
    slide: 41,
    theme: "Population",
    suggested_image: "Diverse crowd forming a large human mosaic",
  },
  {
    slide: 42,
    theme: "Happiness Guaranteed",
    suggested_image: "Bright city scene with smiling people and data overlays",
  },
  {
    slide: 43,
    theme: "Discovery / Tropes",
    suggested_image: "Puzzle pieces connecting into a glowing brain",
  },
  {
    slide: 44,
    theme: "List View / Detail View",
    suggested_image:
      "Zoomable interface moving from overview map to detail panel",
  },
  {
    slide: 45,
    theme: "We all mediate fate together",
    suggested_image: "Group steering a ship through stars",
  },
  {
    slide: 46,
    theme: "Observe Cats",
    suggested_image: "Two cats interacting with emotion-analysis overlays",
  },
  {
    slide: 47,
    theme: "Putting others first",
    suggested_image: "Person helping another person up a hill",
  },
  {
    slide: 48,
    theme: "Collaboration",
    suggested_image: "Large team building something together",
  },
  {
    slide: 49,
    theme: "Learn More = Happy",
    suggested_image: "Character leveling up in a knowledge skill tree",
  },
  {
    slide: 50,
    theme: "Story Changes People",
    suggested_image: "Storybook transforming into real-world scenes",
  },
  {
    slide: 51,
    theme: "Ingredients for Happiness",
    suggested_image:
      "Recipe illustration with happiness components as ingredients",
  },
  {
    slide: 52,
    theme: "Knowledge Creates Answers",
    suggested_image: "Question marks flowing into lightbulbs",
  },
  {
    slide: 54,
    theme: "Composite Simulation States",
    suggested_image: "Multiple world-state snapshots merging into one model",
  },
  {
    slide: 55,
    theme: "Fantasy",
    suggested_image: "Fantasy castle gradually becoming a real city",
  },
  {
    slide: 56,
    theme: "Stories Change World",
    suggested_image: "Ripple effect spreading outward from a book",
  },
  {
    slide: 57,
    theme: "Shared Goal",
    suggested_image: "Group climbing a mountain toward a flag",
  },
  {
    slide: 58,
    theme: "Careful What Circuits We Introduce",
    suggested_image: "Circuit board with warning signs and branching paths",
  },
  {
    slide: 60,
    theme: "Delivery",
    suggested_image: "Pipeline showing Data → Sim → Reality",
  },
  {
    slide: 64,
    theme: "Machinima Dynamic Vis",
    suggested_image: "Film set mixed with virtual worlds and game characters",
  },
  {
    slide: 69,
    theme: "Governance / Security",
    suggested_image:
      "Layered privacy pyramid with green, yellow, and red zones",
  },
  {
    slide: 70,
    theme: "Power of Data",
    suggested_image: "Massive interconnected data network spanning the globe",
  },
  {
    slide: 73,
    theme: "Improving Systems with Data",
    suggested_image: "Flowchart highlighting bottlenecks turning green",
  },
  {
    slide: 75,
    theme: "Failsafes",
    suggested_image: "Multiple safety layers protecting a central system",
  },
  {
    slide: 76,
    theme: "Shared Meaning",
    suggested_image: "Two minds connected by a shared glowing concept",
  },
  {
    slide: 77,
    theme: "This Plan Ensures",
    suggested_image: "Road leading toward multiple positive outcomes",
  },
  {
    slide: 78,
    theme: "Game Makes Ramps to Information",
    suggested_image: "Spiral staircase connecting games to knowledge nodes",
  },
  {
    slide: 84,
    theme: "Improving Storage",
    suggested_image: "Distributed globe network showing regional servers",
  },
  {
    slide: 89,
    theme: "Infinite Opportunity",
    suggested_image: "Horizon filled with branching pathways and possibilities",
  },
];
async function generateAllImages() {
  const targetFolder = path.join(process.cwd(), "44_images");

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  console.log(
    `Starting image generation... Saving outputs to: ${targetFolder}\n`,
  );

  for (const item of data) {
    const fileName = `${item.slide}.jpeg`;
    const filePath = path.join(targetFolder, fileName);

    console.log(`Generating Slide ${item.slide}: "${item.theme}"...`);

    try {
      // FIX: Swapped out enterprise -002 for developer -001 endpoint
      const response = await ai.models.generateImages({
        model: "imagen-3.0-generate-001",
        prompt: item.suggested_image,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "16:9",
        },
      });

      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      fs.writeFileSync(filePath, Buffer.from(base64ImageBytes, "base64"));
      console.log(` Successfully saved ${fileName}`);
    } catch (error) {
      console.error(
        `❌ Failed to generate slide ${item.slide}:`,
        error.message,
      );
    }

    // Pacing delay to keep the free-tier RPM rate analyzer happy
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\nAll generation tasks finalized.");
}

generateAllImages();
// async function generateAllImages() {
//   const targetFolder = path.join(process.cwd(), "44_images");

//   // Ensure the target directory exists
//   if (!fs.existsSync(targetFolder)) {
//     fs.mkdirSync(targetFolder);
//   }

//   console.log(
//     `Starting image generation... Saving outputs to: ${targetFolder}\n`,
//   );

//   for (const item of data) {
//     const fileName = `${item.slide}.jpeg`;
//     console.log(fileName);
//     const filePath = path.join(targetFolder, fileName);

//     console.log(`Generating Slide ${item.slide}: "${item.theme}"...`);

//     try {
//       // Call the correct endpoint model for image generation
//       const response = await ai.models.generateImages({
//         model: "imagen-3.0-generate-002",
//         prompt: item.suggested_image,
//         config: {
//           numberOfImages: 1,
//           outputMimeType: "image/jpeg",
//           aspectRatio: "16:9", // Ideal format for presentation slides
//         },
//       });

//       // Extract raw base64 image string from the payload response
//       const base64ImageBytes = response.generatedImages[0].image.imageBytes;

//       // Save data chunk down as a real binary image file
//       fs.writeFileSync(filePath, Buffer.from(base64ImageBytes, "base64"));
//       console.log(` Successfully saved ${fileName}`);
//     } catch (error) {
//       console.error(
//         `❌ Failed to generate slide ${item.slide}:`,
//         error.message,
//       );
//     }

//     // Tiny pacing delay to prevent rapid-fire network rate limiting
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//   }

//   console.log("\nAll generation tasks finalized.");
// }

// generateAllImages();
