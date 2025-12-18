import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-300 px-5 pt-12 pb-8 mt-2">
      <div className="max-w-7xl mx-auto">
        {/* Logo and tagline */}
        <div className="mb-10">
          <Image
            src="/Outta_logo.svg"
            alt="Outta"
            width={120}
            height={32}
            className="h-8 w-auto mb-3"
          />
          <p className="text-gray-600 text-sm m-0">Discover kid-friendly adventures near you</p>
        </div>

        {/* Footer columns */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-8 mb-10">
          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-black m-0 mb-2 uppercase tracking-wide">
              Legal
            </h3>
            <Link href="/privacy" className="text-sm text-gray-600 no-underline hover:text-flamenco-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 no-underline hover:text-flamenco-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-sm text-gray-600 no-underline hover:text-flamenco-600 transition-colors">
              Cookie Policy
            </Link>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-black m-0 mb-2 uppercase tracking-wide">
              Support
            </h3>
            <a href="mailto:rfinch@outta.events" className="text-sm text-gray-600 no-underline hover:text-flamenco-600 transition-colors">
              Contact
            </a>
            <Link href="/about" className="text-sm text-gray-600 no-underline hover:text-flamenco-600 transition-colors">
              About
            </Link>
            <a href="mailto:rfinch@outta.events" className="text-sm text-gray-600 no-underline hover:text-flamenco-600 transition-colors">
              Help
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-300 pt-6">
          <p className="text-xs text-gray-500 m-0 text-center">
            © {new Date().getFullYear()} Outta. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
