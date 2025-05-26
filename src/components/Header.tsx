import React from 'react';
import { Music, Youtube } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-black/80 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1">
            <Youtube className="h-6 w-6 text-red-500" />
            <Music className="h-6 w-6 text-green-500" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
            MediaRipper
          </h1>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <a 
            href="#" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            Home
          </a>
          <a 
            href="#" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            History
          </a>
          <a 
            href="#" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            Help
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;