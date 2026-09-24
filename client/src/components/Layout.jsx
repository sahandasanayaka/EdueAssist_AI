import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import EduAssistChatbot from './EduAssistChatbot';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#001E2B] font-sans flex flex-col antialiased">
      {/* Mobile Drawer */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      
      {/* Floating Pill Top Navbar - Soft Blurred Backdrop with Clean Spacing */}
      <header className="w-full bg-[#FAF9F5]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 pt-4 pb-3 sticky top-0 z-40 border-b border-[#E2E1D9]/50 transition-all">
        <Header onToggleMobile={() => setMobileOpen(!mobileOpen)} />
      </header>

      {/* Main Content Area - Expansive Canvas with Generous Top Padding */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <Outlet />
      </main>
      
      {/* Floating AI Mascot Chatbot */}
      <EduAssistChatbot />
    </div>
  );
}
