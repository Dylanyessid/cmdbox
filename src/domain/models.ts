// Timestamps are Unix epoch milliseconds.

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommandVariable {
  name: string;
  defaultValue?: string;
  secret: boolean;
}

export interface Command {
  id: string;
  collectionId: string;
  name: string;
  template: string;
  description: string;
  tags: string[];
  variables: CommandVariable[];
  copyCount: number;
  lastUsedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
