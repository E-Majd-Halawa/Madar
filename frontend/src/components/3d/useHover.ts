import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';

/** Hover tracking through a ref, so hovering never re-renders the scene. */
export function useHover() {
  const hovered = useRef(false);

  const handlers = useMemo(
    () => ({
      onPointerOver: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        hovered.current = true;
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: () => {
        hovered.current = false;
        document.body.style.cursor = 'auto';
      },
    }),
    [],
  );

  useEffect(
    () => () => {
      document.body.style.cursor = 'auto';
    },
    [],
  );

  return { hovered, handlers };
}
