export interface User {
  name: string;
  email: string;
  isPro: boolean;
  tokenStatus: string;
  tokenExpiresIn: string;
  avatarUrl: string;
}

export type FileType = 'pdf' | 'docx' | 'csv' | 'pptx' | 'json';
export type DocStatus = 'Analyzed' | 'Processing' | 'New' | 'Idle';

export interface DocumentItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  addedDate: string;
  status: DocStatus;
  progress?: number;
}

export interface ActiveUpload {
  id: string;
  name: string;
  type: FileType;
  progress: number;
}

export interface ProcessingItem {
  id: string;
  name: string;
  status: 'Extracting Text' | 'Generating Embeddings' | 'Exporting metadata...';
  detail: string;
  progress: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  category: 'Research' | 'Collaboration' | 'Security' | 'System';
  message: string;
  time: string;
  actionLabel?: string;
  isRead: boolean;
  fileId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastActive: string;
  preview: string;
  closed: boolean;
  messages: Array<{ sender: 'user' | 'assistant'; text: string; time: string }>;
}

export interface AppSettings {
  fastapiEndpoint: string;
  apiKey: string;
  defaultModel: string;
  researchFocus: string;
  darkMode: boolean;
  highContrast: boolean;
  autoSaveDrafts: boolean;
  apiKnowledgeKey: string;
  accountName: string;
  email: string;
}
