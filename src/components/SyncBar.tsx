import type { SyncBarProps } from "../types/powerCurve";

/**
 * Absolutely-positioned bar in the top-right corner of the dashboard.
 * Shows the last sync status message and provides Sync / Sign-out controls.
 */
export default function SyncBar({ syncing, syncMessage, onSync, onLogout }: SyncBarProps) {
  const isSyncError = syncMessage?.startsWith("Sync failed") ?? false;

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-3 font-mono text-[11px]">
      {syncMessage && (
        <span className={isSyncError ? "text-red-400" : "text-emerald-400"}>
          {syncMessage}
        </span>
      )}

      <button
        onClick={onSync}
        disabled={syncing}
        className={`bg-transparent border border-slate-700 text-zinc-500 px-3 py-1.5 rounded text-[11px] font-mono transition-opacity ${
          syncing
            ? "opacity-50 cursor-default"
            : "cursor-pointer hover:text-zinc-400 hover:border-slate-600"
        }`}
      >
        {syncing ? "Syncing…" : "Sync Rides"}
      </button>

      <button
        onClick={onLogout}
        className="bg-transparent border-none text-zinc-600 px-1 py-1.5 cursor-pointer font-mono text-[11px] hover:text-zinc-500 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
