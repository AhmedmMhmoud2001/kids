import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Tag
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
  { icon: Package, label: 'Products', path: '/dashboard/products' },
  { icon: Users, label: 'Customers', path: '/dashboard/customers' },
  { icon: Megaphone, label: 'Promotions', path: '/dashboard/promotions' },
  { icon: Tag, label: 'Categories', path: '/dashboard/categories' },
  { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('/dashboard');

  const bgColor = '#FFFFFF';
  const activeColor = '#5DA5F9';
  const activeBg = 'rgba(93, 165, 249, 0.1)';
  const hoverBg = 'rgba(93, 165, 249, 0.05)';
  const textPrimary = '#1F2937';
  const textSecondary = '#6B7280';
  const borderColor = '#E5E7EB';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside 
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:top-0 lg:h-full
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
        style={{ backgroundColor: bgColor, borderRight: `1px solid ${borderColor}` }}
      >
        <div className="h-full flex flex-col">
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setActiveItem(item.path)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${activeItem === item.path 
                    ? 'text-[#5DA5F9] font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                  ${isCollapsed ? 'lg:justify-center lg:px-3' : ''}
                `}
                style={activeItem === item.path ? { backgroundColor: activeBg } : {}}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${activeItem === item.path ? 'text-[#5DA5F9]' : 'text-gray-400'}`} />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className={`p-4 border-t ${isCollapsed ? 'lg:block hidden' : ''}`} style={{ borderColor }}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`
                flex items-center gap-3 w-full px-4 py-3 rounded-xl 
                text-gray-500 hover:bg-gray-50 transition-colors
                ${isCollapsed ? 'lg:justify-center lg:px-3' : ''}
              `}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;