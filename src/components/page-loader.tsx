"use client";

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
