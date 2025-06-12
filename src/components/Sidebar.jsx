// components/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
BarChart3,
TrendingUp,
Users,
Settings,
Activity,
PieChart,
Plus,
Bot
} from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';

const Sidebar = ({ isOpen, onClose }) => {
const { state } = useDeFi();
const navigate = useNavigate();
const location = useLocation();

const menuItems = [
 { icon: BarChart3, label: 'Main', path: '/funds', color: 'from-blue-500 to-cyan-500' },
 { icon: Plus, label: 'Create Fund', path: '/create-fund', color: 'from-teal-500 to-cyan-500' },
 { icon: TrendingUp, label: 'My Funds', path: '/dashboard', color: 'from-purple-500 to-pink-500' },
 { icon: Users, label: 'Users', path: '/users', color: 'from-green-500 to-emerald-500' },
 { icon: Activity, label: 'Transactions', path: '/transactions', color: 'from-orange-500 to-red-500' },
 { icon: PieChart, label: 'Analytics', path: '/analytics', color: 'from-indigo-500 to-purple-500' },
 { icon: Bot, label: 'AI Funds', path: '/ai-funds', color: 'from-violet-500 to-purple-500' },
 { icon: Settings, label: 'Settings', path: '/settings', color: 'from-gray-500 to-slate-500' },
 ];

const handleNavigation = (path) => {
navigate(path);
onClose();
 };

// Check if current path matches the menu item path
const isActivePath = (path) => {
if (path === '/funds') {
// For funds, also match fund detail pages
return location.pathname === path || location.pathname.startsWith('/page/');
 }
return location.pathname === path;
 };

return (
<>
{/* Mobile overlay */}
{isOpen && (
<div
className="fixed inset-0 bg-black/50 z-40 lg:hidden"
onClick={onClose}
/>
 )}

{/* Sidebar */}
<aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 z-50 transition-transform duration-300 lg:translate-x-0 ${
isOpen ? 'translate-x-0' : '-translate-x-full'
} ${state.isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r`}>
<div className="p-4 space-y-2">
{menuItems.map((item, index) => (
<button
key={index}
onClick={() => handleNavigation(item.path)}
className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
isActivePath(item.path)
 ? state.isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
 : state.isDarkMode
 ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
 : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
}`}
>
<div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
<item.icon className="w-4 h-4 text-white" />
</div>
<span className="font-medium">{item.label}</span>
</button>
 ))}
</div>
</aside>
</>
 );
};

export default Sidebar;