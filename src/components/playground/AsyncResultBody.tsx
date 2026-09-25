import type { ReactNode } from "react";
import type { AsyncState } from "./types";

interface Props<T> {
  state: AsyncState<T>;
  renderDone: (result: T) => ReactNode;
}

/** The idle/loading/error/done branch shared by every result detail view, regardless of modality. */
export function AsyncResultBody<T>({ state, renderDone }: Props<T>) {
  if (state.status === "idle") {
    return <p className="text-sm text-neutral-500">Not run yet.</p>;
  }

  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-2">
        <div className="animate-shimmer h-3 w-[85%] rounded-full" />
        <div className="animate-shimmer h-3 w-[65%] rounded-full" />
        <div className="animate-shimmer h-3 w-[75%] rounded-full" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <p className="rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3 text-sm text-red-300">
        {state.message}
      </p>
    );
  }

  return <>{renderDone(state.result)}</>;
}
