import { Home, FileText, Upload, Wrench, Bell, Settings, LogOut, HelpCircle, HardDrive, Plus, Folder, Sparkles } from 'lucide-react';
import { User } from '../types';


interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  notificationsCount: number;
  onTriggerNewResearch: () => void;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  user,
  onLogout,
}: SidebarProps) {
  if (!user) return null;

  const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },

  { id: 'projects', label: 'Projects', icon: HardDrive },

  { id: 'uploads', label: 'Uploads', icon: Folder },

  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'conversations', label: 'Conversations', icon: FileText },
];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-brand-surface-lowest border-r border-brand-border flex flex-col py-6 px-4 z-50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-brand-primary-container rounded-xl flex items-center justify-center text-brand-on-primary-container shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-geist text-lg font-bold text-brand-primary leading-tight">Research Assistant</h1>
          <p className="text-xs text-brand-on-secondary-container opacity-60">Workspace</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 outline-none hover:bg-brand-surface-container hover:text-brand-primary text-sm ${
                isActive
                  ? 'bg-brand-primary-container/10 text-brand-primary font-bold border-l-4 border-brand-primary pl-2'
                  : 'text-brand-on-secondary-container hover:text-brand-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="mt-auto pt-4 border-t border-brand-border/40 space-y-4">
       

        {/* Support & Logout Links */}
        <div className="space-y-1">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-brand-error/70 hover:text-brand-error text-sm rounded-lg transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
