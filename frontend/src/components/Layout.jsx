import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children, isAdmin = false }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isAdmin={isAdmin}
            />

            {/* Main content */}
            <div className="lg:ml-64 min-h-screen flex flex-col">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>

                {/* Footer */}
                <footer className="py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-dark-700">
                    © 2024 SecureBank. All rights reserved.
                </footer>
            </div>
        </div>
    );
};

export default Layout;
