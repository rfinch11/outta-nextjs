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
        className="fixed inset-0 bg-black/50 z-[1000] flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-t-[20px] sm:rounded-2xl w-full sm:max-w-[600px] h-[90vh] sm:h-[80vh] flex flex-col animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
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
          <div className="flex-1 overflow-hidden relative">
            <div
              data-tf-live="01KB8W0MZ1NK6GBGTFA5AWAQ4H"
              data-tf-opacity="100"
              data-tf-iframe-props="title=Submit a Listing"
              data-tf-transitive-search-params
              data-tf-medium="snippet"
              className="w-full h-full"
            ></div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        /* Make Typeform iframe fill full height */
        [data-tf-live] iframe {
          height: 100% !important;
          min-height: 100% !important;
        }

        /* Hide Typeform header/branding */
        [data-tf-live] .tf-v1-widget-header,
        [data-tf-live] .tf-v1-sidetab,
        [data-tf-live] .powered-by {
          display: none !important;
        }
      `}</style>
    </>
  );
};

export default SubmitModal;
