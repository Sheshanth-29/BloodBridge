import { useEffect, useRef } from "react";

/**
 * Wraps a page in a smooth fade-in-up entrance so every route transition
 * feels like an animated SPA navigation instead of a hard page reload.
 */
export default function PageTransition({ children, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(14px)";
    const id = requestAnimationFrame(() => {
      el.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
