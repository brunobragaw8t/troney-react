interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps) {
  return (
    <div className="pointer-events-none absolute bottom-full right-1/2 mb-2 flex translate-x-1/2 transform items-center gap-2 whitespace-nowrap rounded bg-secondary-2 px-3 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100">
      {children}
      <div className="absolute right-1/2 top-full h-0 w-0 translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-secondary-2" />
    </div>
  );
}
