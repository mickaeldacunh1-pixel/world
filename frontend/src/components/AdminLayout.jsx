import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ShoppingCart, CreditCard, Users,
  Newspaper, Settings, AlertTriangle, ChevronLeft, ChevronRight,
  BookOpen, Menu, X, LogOut, Home
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const menuItems = [
  { 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/admin',
    exact: true
  },
  { 
    label: 'Ventes & Reversements', 
    icon: ShoppingCart, 
    path: '/admin/ventes'
  },
  { 
    label: 'Paiements', 
    icon: CreditCard, 
    path: '/admin/paiements'
  },
  { 
    label: 'Actualités', 
    icon: Newspaper, 
    path: '/admin/actualites'
  },
  { 
    label: 'Signalements', 
    icon: AlertTriangle, 
    path: '/admin/signalements'
  },
  { 
    label: 'Guide Ventes', 
    icon: BookOpen, 
    path: '/admin/guide-ventes'
  },
  { 
    label: 'Configuration', 
    icon: Settings, 
    path: '/admin/parametres'
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-white">Admin</h2>
              <p className="text-xs text-gray-400">WorldAutoFrance</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              isActive(item) 
                ? "bg-accent text-white" 
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Retour au site</span>}
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Déconnexion</span>}
        </button>
        {!collapsed && (
          <div className="px-3 pt-2">
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white hover:bg-gray-700"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
          <span className="font-bold text-white">Admin</span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-gray-800 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <SidebarContent />
        
        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-gray-700 rounded-full items-center justify-center text-gray-300 hover:bg-gray-600 hover:text-white"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "transition-all duration-300 min-h-screen",
          collapsed ? "lg:ml-16" : "lg:ml-64",
          "pt-14 lg:pt-0"
        )}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
