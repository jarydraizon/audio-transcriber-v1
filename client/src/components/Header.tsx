import { Link, useLocation } from "wouter";
import { Mic } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Mic className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-slate-900">Audio Transcription Tool</h1>
            </div>
          </Link>
          <nav>
            <Link href="/about">
              <a className={`text-sm font-medium ${location === '/about' ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}>
                About
              </a>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
