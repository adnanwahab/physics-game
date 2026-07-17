import React from "react";

export default function ImageGrid() {
  // Simulating 9 items for our 3x3 grid
  const items = Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    title: `Item ${index + 1}`,
    // You can replace this string with your actual image URLs later
    imageSrc:
      "https://static0.srcdn.com/wordpress/wp-content/uploads/2023/01/harry-potter-pensieve-memories-movies-missing.jpg?w=1200&h=675&fit=crop",
  }));

  return (
    <div className="w-1/2 max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <img
              src={item.imageSrc}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* Optional overlay that shows on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="text-sm font-medium text-white">
                {item.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
