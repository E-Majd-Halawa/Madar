import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useSettingsStore } from '@/store/settingsStore';
import { useUiStore } from '@/store/uiStore';

/** True when the event target is a text entry (suppresses single-key shortcuts). */
const isTyping = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
};

/** True if ANY native <dialog> is open (modal guards). */
const isModalOpen = (): boolean => !!document.querySelector('dialog[open]');

/** True when the user is composing an IME character. */
let composing = false;

/**
 * Centralized keyboard shortcut handler.
 * - Single-key shortcuts (N, P, F, C, G, /, ?) are disabled while typing, in modals, or
 *   during IME composition. They also respect the `singleKeyShortcuts` setting.
 * - Ctrl/Cmd+K is always active (except inside an input, where Esc still works).
 * - Esc closes the top-most overlay (command palette > modals).
 */
export function useKeyboardShortcuts(): void {
  const navigate = useNavigate();
  const gSequenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingGRef = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => { composing = true; };
    const onCompositionEnd   = () => { composing = false; };
    document.addEventListener('compositionstart', onCompositionStart);
    document.addEventListener('compositionend', onCompositionEnd);
    return () => {
      document.removeEventListener('compositionstart', onCompositionStart);
      document.removeEventListener('compositionend', onCompositionEnd);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const { key, code, ctrlKey, metaKey, altKey, shiftKey } = event;
      const mod = ctrlKey || metaKey;
      const typing = isTyping(event.target);
      const modal  = isModalOpen();

      // ── Ctrl/Cmd+K — command palette ──────────────────────────────────────
      if (mod && !altKey && (key.toLowerCase() === 'k' || code === 'KeyK')) {
        event.preventDefault();
        useUiStore.getState().setCommandPalette(true);
        return;
      }

      // ── Esc — close top-most overlay ──────────────────────────────────────
      if ((key === 'Escape' || code === 'Escape') && !mod && !altKey) {
        if (useUiStore.getState().commandPaletteOpen) {
          event.preventDefault();
          useUiStore.getState().setCommandPalette(false);
        }
        return;
      }

      // Below this point: block if modifier, typing, modal, or composing ─────
      if (mod || altKey || typing || modal || composing) return;

      // Check single-key shortcuts setting ────────────────────────────────────
      const settingsAsAny = useSettingsStore.getState() as unknown as Record<string, unknown>;
      const singleKeyEnabled = settingsAsAny['singleKeyShortcuts'] !== false;

      const lk = key.toLowerCase();

      // ── G-sequence (two-key sequences with 0.8s timeout) ──────────────────
      if (awaitingGRef.current) {
        awaitingGRef.current = false;
        if (gSequenceRef.current) clearTimeout(gSequenceRef.current);
        const secondKey = lk;
        const secondCode = code;
        const gMap: Record<string, () => void> = {
          d: () => navigate(ROUTES.app.dashboard),
          t: () => navigate(ROUTES.app.tasks),
          p: () => navigate(ROUTES.app.projects),
          s: () => navigate(ROUTES.app.settings),
          a: () => navigate(ROUTES.app.analytics),
          i: () => navigate(ROUTES.app.ai),
          c: () => navigate(ROUTES.app.chat),
        };
        const action =
          gMap[secondKey] ||
          (secondCode === 'KeyD' ? gMap.d :
           secondCode === 'KeyT' ? gMap.t :
           secondCode === 'KeyP' ? gMap.p :
           secondCode === 'KeyS' ? gMap.s :
           secondCode === 'KeyA' ? gMap.a :
           secondCode === 'KeyI' ? gMap.i :
           secondCode === 'KeyC' ? gMap.c : undefined);

        if (action) {
          event.preventDefault();
          action();
        }
        return;
      }

      if (!singleKeyEnabled) return;

      if (lk === 'g' || code === 'KeyG') {
        awaitingGRef.current = true;
        gSequenceRef.current = setTimeout(() => {
          awaitingGRef.current = false;
          navigate(ROUTES.app.chat);
        }, 800);
        return;
      }

      const singleMap: Record<string, () => void> = {
        n: () => useUiStore.getState().setTaskModal(true),
        p: () => useUiStore.getState().setProjectModal(true),
        f: () => navigate(ROUTES.app.focus),
        c: () => navigate(ROUTES.app.calendar),
        '/': () => {
          event.preventDefault();
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="search"], input[placeholder*="Search" i], input[placeholder*="بحث" i], [data-search-input]'
          );
          if (searchInput) {
            searchInput.focus();
          } else {
            navigate(ROUTES.app.search);
          }
        },
        '?': () => {
          event.preventDefault();
          useUiStore.getState().setCommandPalette(true);
        },
      };

      const action =
        singleMap[lk] ||
        (code === 'Slash' || lk === '?' || (shiftKey && (code === 'Slash' || lk === '/')) ? singleMap['?'] :
         code === 'KeyN' ? singleMap.n :
         code === 'KeyP' ? singleMap.p :
         code === 'KeyF' ? singleMap.f :
         code === 'KeyC' ? singleMap.c :
         code === 'Slash' ? singleMap['/'] : undefined);

      if (action) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (gSequenceRef.current) clearTimeout(gSequenceRef.current);
    };
  }, [navigate]);
}
