"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Custom hook for scroll-triggered animations
export function useScrollAnimation<T extends HTMLElement>(
  options: {
    trigger?: string;
    start?: string;
    end?: string;
    scrub?: boolean | number;
    markers?: boolean;
    onEnter?: () => void;
    onLeave?: () => void;
    onEnterBack?: () => void;
    onLeaveBack?: () => void;
  } = {}
) {
  const elementRef = useRef<T>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    triggerRef.current = ScrollTrigger.create({
      trigger: element,
      start: options.start || "top 80%",
      end: options.end || "bottom 20%",
      scrub: options.scrub,
      markers: options.markers,
      onEnter: options.onEnter,
      onLeave: options.onLeave,
      onEnterBack: options.onEnterBack,
      onLeaveBack: options.onLeaveBack,
    });

    return () => {
      triggerRef.current?.kill();
    };
  }, [options]);

  return elementRef;
}

// Parallax hook
export function useParallax(speed: number = 0.5) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    tl.fromTo(
      element,
      { y: -100 * speed },
      { y: 100 * speed, ease: "none" }
    );

    return () => {
      tl.kill();
    };
  }, [speed]);

  return elementRef;
}

// Magnetic effect hook
export function useMagnetic(strength: number = 0.3) {
  const elementRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      setPosition({
        x: distanceX * strength,
        y: distanceY * strength,
      });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return { elementRef, position };
}

// Smooth counter hook
export function useCounter(
  end: number,
  duration: number = 2000,
  startOnView: boolean = true
) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!startOnView) {
      animateCount();
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
          animateCount();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [end, duration, hasStarted, startOnView]);

  const animateCount = () => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };

  return { count, elementRef };
}

// Text reveal animation
export function useSplitText() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const text = container.innerText;
    const words = text.split(" ");

    container.innerHTML = words
      .map(
        (word, i) =>
          `<span class="inline-block overflow-hidden"><span class="inline-block translate-y-full" style="transition-delay: ${i * 50}ms">${word}</span></span>`
      )
      .join(" ");

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      onEnter: () => {
        const spans = container.querySelectorAll("span > span");
        spans.forEach((span) => {
          (span as HTMLElement).style.transform = "translateY(0)";
        });
      },
    });

    return () => trigger.kill();
  }, []);

  return containerRef;
}
