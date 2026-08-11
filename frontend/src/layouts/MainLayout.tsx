import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, MessageSquare, Search, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-light dark:bg-bg-dark transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${desktopSidebarCollapsed ? 'lg:w-0 lg:overflow-hidden lg:-translate-x-full lg:border-none lg:opacity-0' : 'lg:relative lg:translate-x-0'} z-30 transition-all duration-300 ease-in-out`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative pb-16 lg:pb-0">
        {/* Mobile Header (Sticky) */}
        <div className="lg:hidden h-14 border-b border-gray-200 dark:border-white/10 flex items-center px-4 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md absolute top-0 w-full z-10">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold ml-2 text-gray-900 dark:text-white">AI Chatbot</h1>
        </div>
        
        {/* Desktop Sidebar Toggle */}
        <div className="hidden lg:flex absolute top-4 left-4 z-20">
          <button 
            onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)} 
            className={`p-2 bg-white/80 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm ${desktopSidebarCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            title="Expand Sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        </div>
        
        {/* If Sidebar is expanded, show the collapse button inside the sidebar or right next to it? Wait, we can pass a collapse prop to Sidebar or just let this floating button overlap the UI. Since Sidebar has a solid bg, let's put the collapse button inside Sidebar.tsx. */}
        {/* But we don't have access to the state inside Sidebar easily without props. So we can just put a toggle button inside the main layout that overlaps the Sidebar, or right inside Chat.tsx. Let's just pass desktopSidebarCollapsed and setDesktopSidebarCollapsed to Sidebar if we modify it. Or just put the toggle button in the top left of the main content area, which gets pushed right when sidebar expands! */}
        <div className={`hidden lg:flex absolute top-4 z-20 transition-all duration-300 ${desktopSidebarCollapsed ? 'left-4' : 'left-4'}`}>
          {!desktopSidebarCollapsed && (
             <button 
               onClick={() => setDesktopSidebarCollapsed(true)} 
               className="p-2 bg-white/80 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm opacity-0 hover:opacity-100"
               title="Collapse Sidebar"
             >
               <PanelLeftClose size={20} />
             </button>
          )}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden pt-14 lg:pt-0 h-full">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 w-full h-16 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-white/10 flex items-center justify-around z-20 px-2 pb-safe">
          <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/' || location.pathname.startsWith('/c/') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            <MessageSquare size={20} />
            <span className="text-[10px] font-medium">Chat</span>
          </Link>
          <Link to="/search" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/search' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            <Search size={20} />
            <span className="text-[10px] font-medium">Search</span>
          </Link>
          <Link to="/settings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/settings' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            <Settings size={20} />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
