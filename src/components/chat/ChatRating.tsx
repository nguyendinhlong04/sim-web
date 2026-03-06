"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ChatRatingProps {
  onRate: (rating: number) => void;
  title?: string;
  thankYou?: string;
}

export default function ChatRating({
  onRate,
  title = "Rate this conversation",
  thankYou = "Thank you for your feedback!",
}: ChatRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = (value: number) => {
    setRating(value);
    setSubmitted(true);
    onRate(value);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={20}
              className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">{thankYou}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-4">
      <p className="mb-2 text-sm text-gray-600">{title}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onMouseEnter={() => setHoveredStar(i)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => handleRate(i)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={24}
              className={
                i <= (hoveredStar || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}
