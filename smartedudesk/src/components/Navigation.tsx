
import React from 'react';
import { LayoutDashboard, Users, GraduationCap, Grid3X3, ArrowRightLeft, FileText, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master Table', icon: Grid3X3 },
    { id: 'adjustment', label: 'Adjustment', icon: ArrowRightLeft },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'slips', label: 'Teacher Slips', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-white border-b sticky top-0 z-50 no-print">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex justify-center items-center h-14">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold shrink-0 ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <item.icon size={16} className={activeTab === item.id ? 'text-blue-600' : 'text-gray-400'} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
