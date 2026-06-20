import { User, DocumentItem, NotificationItem, ChatSession, AppSettings } from './types';

export const DEFAULT_USER: User = {
  name: 'Dr. Aris Thorne',
  email: 'a.thorne@university.edu',
  isPro: true,
  tokenStatus: 'Active',
  tokenExpiresIn: '12h',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBL2LssZw9O7PCdIv0VIEQSPDk3DtRyYreo1VUyunHXKTjhK_qkrLptl669SpBGOmFx06NRKVt5Myrl_W_mjtSZu25XPk5-EOImAsSqr5u165so8rQHn0GvCiQ1ut24BqKOB-bIPWeqXHH-SPY8GFnlK6S854kuQVhFRUVcDX4hsdFOLT9BUbaPeOWiRQdcCShMKJ8iki0C1Bn0kGvt7crtFFGgNGAQN4nGwqeSoDVs78GCRJg8ZYH1OfDNVVsOw5cWZPt1IM6k4Y'
};

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Neural_Architecture_Search.pdf',
    type: 'pdf',
    size: '4.2 MB',
    addedDate: 'Oct 24, 2023',
    status: 'Analyzed'
  },
  {
    id: 'doc-2',
    name: 'Quantum_Computing_Review.docx',
    type: 'docx',
    size: '1.8 MB',
    addedDate: 'Oct 23, 2023',
    status: 'Processing',
    progress: 70
  },
  {
    id: 'doc-3',
    name: 'Clinical_Trial_Data_v2.csv',
    type: 'csv',
    size: '12.5 MB',
    addedDate: 'Oct 22, 2023',
    status: 'New'
  },
  {
    id: 'doc-4',
    name: 'Market_Synthesis_2024.pptx',
    type: 'pptx',
    size: '8.1 MB',
    addedDate: 'Oct 20, 2023',
    status: 'Analyzed'
  },
  {
    id: 'doc-5',
    name: 'BioTech_Innovation_Study.pdf',
    type: 'pdf',
    size: '3.2 MB',
    addedDate: 'Oct 18, 2023',
    status: 'Analyzed'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Research Update',
    category: 'Research',
    message: 'Neural_Architecture_Search.pdf has finished processing. 12 new insights generated.',
    time: 'Just now',
    actionLabel: 'Review Insights',
    isRead: false,
    fileId: 'doc-1'
  },
  {
    id: 'notif-2',
    title: 'New Collaboration',
    category: 'Collaboration',
    message: "Collaborator Dr. Julian Vane shared a new dataset: 'Genomic_Data_v2.csv'.",
    time: '45m ago',
    actionLabel: 'View Dataset',
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'Security Alert',
    category: 'Security',
    message: 'New login detected from a new IP address in San Francisco, CA. If this wasn\'t you, please secure your account immediately.',
    time: '2h ago',
    isRead: false
  },
  {
    id: 'notif-4',
    title: 'System Maintenance',
    category: 'System',
    message: 'Server maintenance scheduled for 02:00 UTC. Brief downtime expected during database optimization.',
    time: '5h ago',
    isRead: false
  },
  {
    id: 'notif-5',
    title: 'Weekly Summary Ready',
    category: 'Research',
    message: 'Your research activity for last week has been summarized. You completed 14 analyses and viewed 89 citations.',
    time: 'Yesterday',
    isRead: true
  }
];

export const INITIAL_CHAT_HISTORY: ChatSession[] = [
  {
    id: 'chat-1',
    title: 'Transformer Model Evaluation',
    lastActive: '5m ago',
    preview: 'Analyzing self-attention layer weights...',
    closed: false,
    messages: [
      { sender: 'user', text: 'Can you compare the parameter efficiency of modern vision transformers?', time: '10m ago' },
      { sender: 'assistant', text: 'Vision Transformers (ViTs) generally require larger pre-training sets compared to CNNs due to the absence of inductive bias such as translation invariance. However, architectures like Swin Tranformers achieve superior parameter efficiency via local-window attention mechanisms.', time: '5m ago' }
    ]
  },
  {
    id: 'chat-2',
    title: 'Dataset Cleaning Scripts',
    lastActive: '2h ago',
    preview: 'Cleaned numeric outliers outside 3-std...',
    closed: true,
    messages: [
      { sender: 'user', text: 'Explain the outliers script.', time: '3h ago' },
      { sender: 'assistant', text: 'I isolated records with field value beyond 3 standard deviations from mean dataset density. 25 outliers dropped successfully.', time: '2h ago' }
    ]
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  fastapiEndpoint: 'https://api.research-node.local/v1',
  apiKey: 'sk-research-intelligence-2024-xcv982',
  defaultModel: 'Claude 3.5 Sonnet',
  researchFocus: 'Natural Language Processing',
  darkMode: true,
  highContrast: false,
  autoSaveDrafts: true,
  apiKnowledgeKey: 'sk-research-intelligence-2024-xcv982',
  accountName: 'Dr. Aris Thorne',
  email: 'a.thorne@university.edu'
};
