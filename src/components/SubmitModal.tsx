'use client';

import React, { useEffect } from 'react';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Load Typeform embed script
      const script = document.createElement('script');
      script.src = '//embed.typeform.com/next/embed.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        // Cleanup script on unmount
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl w-full max-w-[800px] max-h-[90vh] h-[600px] flex flex-col mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold m-0">Submit a Listing</h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 bg-transparent border-none text-2xl font-normal cursor-pointer p-2 leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Typeform Embed */}
          <div className="flex-1 overflow-hidden">
            <div data-tf-live="01KB8W0MZ1NK6GBGTFA5AWAQ4H" className="w-full h-full"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubmitModal;
