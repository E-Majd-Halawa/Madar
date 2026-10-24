import { useState, useRef, useEffect, useContext, createContext, type ReactNode, type ReactElement, isValidElement, cloneElement, Children, type RefObject } from 'react';
import { cn } from '@/utils/cn';

interface DropdownMenuProps {
  children: ReactNode;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: ReactElement;
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu');
  }
  return context;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const contextValue = { open, setOpen, triggerRef };

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <div className="relative inline-block" onKeyDown={handleKeyDown}>
        <span ref={triggerRef}>{children}</span>
        {open && (
          <>
            <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />
            <div
              ref={contentRef}
              className="glass z-50 absolute right-0 top-full mt-1 w-48 origin-top-right rounded-xl border border-border/20 py-1 shadow-depth animate-in fade-in-0 zoom-in-95 duration-100"
              role="menu"
            >
              {Children.map(children, (child) => {
                if (isValidElement(child) && child.type === DropdownMenuItem) {
                  return cloneElement(child, { onClick: () => setOpen(false) } as Partial<DropdownMenuItemProps>);
                }
                return child;
              })}
            </div>
          </>
        )}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownMenu();

  const handleClick = () => setOpen(!open);

  if (asChild) {
    return cloneElement(children, {
      ref: triggerRef,
      onClick: handleClick,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
    });
  }

  return (
    <button
      ref={triggerRef}
      onClick={handleClick}
      className="inline-flex items-center gap-2"
      aria-haspopup="menu"
      aria-expanded={open}
    >
      {children}
    </button>
  );
}

export function DropdownMenuItem({ children, className, onClick, ...props }: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(event);
    setOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-fg transition-colors',
        'hover:bg-surface-2 hover:text-accent focus:outline-none focus:bg-surface-2',
        className,
      )}
      role="menuitem"
      {...props}
    >
      {children}
    </button>
  );
}