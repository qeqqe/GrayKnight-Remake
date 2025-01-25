import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import PixelTransition from "@/src/reactbits/Animations/PixelTransition/PixelTransition";

interface TrackArtworkProps {
  imageUrl: string;
  albumName: string;
  trackId: string;
}

export function TrackArtwork({
  imageUrl,
  albumName,
  trackId,
}: TrackArtworkProps) {
  const [key, setKey] = useState(0);
  const prevTrackIdRef = useRef(trackId);

  useEffect(() => {
    if (prevTrackIdRef.current !== trackId) {
      setKey((prev) => prev + 1);
      prevTrackIdRef.current = trackId;
    }
  }, [trackId]);

  const ImageContent = (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Image
        src={imageUrl || "/fallback-image.png"}
        alt={albumName || "Album cover"}
        width={128}
        height={128}
        className="w-full h-full object-cover"
        priority
      />
    </div>
  );

  return (
    <PixelTransition
      key={`${trackId}-${key}`}
      firstContent={ImageContent}
      secondContent={ImageContent}
      gridSize={12}
      pixelColor="#18181b"
      animationStepDuration={0.4}
      aspectRatio="100%"
      style={{
        borderRadius: "0.5rem",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    />
  );
}
