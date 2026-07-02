"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="mt-4 rounded-2xl border border-slate-200 px-4 py-2 text-sm print:hidden">
      Print
    </button>
  );
}
