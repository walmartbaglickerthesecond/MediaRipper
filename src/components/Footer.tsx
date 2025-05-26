import React from 'react';
import { Github, Coffee } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black/80 border-t border-gray-800 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} MediaRipper. For personal use only.
          </p>
          <div className="flex items-center space-x-6">
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Github size={18} />
              <span className="text-sm">Source</span>
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Coffee size={18} />
              <span className="text-sm">Support</span>
            </a>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This tool is for educational purposes only. Please respect copyright laws and terms of service.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;