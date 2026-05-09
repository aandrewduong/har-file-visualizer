import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

// Reports the current pointer X each mousemove during a drag started by
// `startDrag`. The latest callback is captured by ref so consumers can
// reference fresh state without re-binding window listeners on every render.
export function useDragX(onDrag: (clientX: number) => void) {
  const onDragRef = useRef(onDrag);
  useEffect(() => {
    onDragRef.current = onDrag;
  }, [onDrag]);

  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    // Lock the global cursor / disable selection so a fast drag across the
    // request list doesn't accidentally highlight text or flicker cursors.
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => onDragRef.current(ev.clientX);
    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  return { isDragging, startDrag };
}
