interface SpinnerProps {
  message?: string;
}

export function Spinner({ message }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-1"
        role="status"
        aria-label={message || "Loading"}
      >
        <span className="sr-only">Loading...</span>
      </div>

      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
