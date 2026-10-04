// types/audit.ts
export interface Division {
  id: number;
  key: string;
  name: string;
  icon: string;
  description: string;
  _count?: { regulations: number };
}

export interface Regulation {
  id: number;
  divisionId: number;
  regulationType: string;
  regulationNumber: string;
  year: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  division?: Division;
  _count?: { norms: number; documents: number };
}

export interface Norm {
  id: number;
  regulationId: number;
  normCode: string;
  criteria: string;
  article: string;
  paragraph: string | null;
  originalText: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rules: Rule[];
  regulation?: Regulation & { division: Division; documents: Document[] };
}

export interface Rule {
  id: number;
  normId: number;
  ruleCode: string;
  maximumValue: number | null;
  operator: string;
  parameter: string;
  condition: string;
  inspectionIndicator: string;
  minimumValue: number | null;
  unit: string;
  textThreshold: string;
  numericValue: number | null;
  ruleType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  regulationId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  uploadStatus: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  createdAt: string;
}