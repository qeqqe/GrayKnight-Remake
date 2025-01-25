/*
	jsrepo 1.28.4
	Installed from https://reactbits.dev/default/
	25-1-2025
*/

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import "./PixelTransition.scss";

function PixelTransition({
  firstContent,
  secondContent,
  gridSize = 7,
  pixelColor = "currentColor",
  animationStepDuration = 0.3,
  className = "",
  style = {},
  aspectRatio = "100%",
}) {
  const containerRef = useRef(null);
  const pixelGridRef = useRef(null);
  const activeRef = useRef(null);
  const animationRef = useRef(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const pixelGridEl = pixelGridRef.current;
    if (!pixelGridEl || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    pixelGridEl.innerHTML = "";

    // Create pixels
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement("div");
        pixel.classList.add("pixelated-image-card__pixel");
        pixel.style.backgroundColor = pixelColor;

        const size = 100 / gridSize;
        pixel.style.width = `${size}%`;
        pixel.style.height = `${size}%`;
        pixel.style.left = `${col * size}%`;
        pixel.style.top = `${row * size}%`;
        pixelGridEl.appendChild(pixel);
      }
    }

    // Get all pixels and create timeline
    const pixels = pixelGridEl.querySelectorAll(".pixelated-image-card__pixel");
    const timeline = gsap.timeline();

    // Initial state
    gsap.set(pixels, { display: "none" });

    // Animation sequence
    const totalPixels = pixels.length;
    const staggerDuration = animationStepDuration / totalPixels;

    timeline
      .to(pixels, {
        display: "block",
        duration: 0,
        stagger: {
          each: staggerDuration,
          from: "random",
        },
      })
      .to(pixels, {
        display: "none",
        duration: 0,
        stagger: {
          each: staggerDuration,
          from: "random",
        },
        onComplete: () => {
          isAnimatingRef.current = false;
          if (activeRef.current) {
            activeRef.current.style.display = "block";
          }
        },
      });

    animationRef.current = timeline;

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      isAnimatingRef.current = false;
    };
  }, [gridSize, pixelColor, animationStepDuration]);

  return (
    <div
      ref={containerRef}
      className={`pixelated-image-card ${className}`}
      style={style}
    >
      <div style={{ paddingTop: aspectRatio }} />
      <div className="pixelated-image-card__default">{firstContent}</div>
      <div
        className="pixelated-image-card__active"
        ref={activeRef}
        style={{ display: "none" }}
      >
        {secondContent}
      </div>
      <div className="pixelated-image-card__pixels" ref={pixelGridRef} />
    </div>
  );
}

export default PixelTransition;
