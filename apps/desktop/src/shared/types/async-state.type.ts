export type AsyncState<TData> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: TData | null; error: null }
  | { status: "success"; data: TData; error: null }
  | { status: "error"; data: TData | null; error: string };
