export interface AnalisisState {
  file: File | null;
  loading: boolean;
  result: string;
  error: string;
  provider?: string;
}

export type DivisiState = Record<string, AnalisisState>;