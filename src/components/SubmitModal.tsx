'use client';

import React from 'react';
import { Widget } from '@typeform/embed-react';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose }) => {
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
            <Widget
              id="kQU0pScO"
              style={{ width: '100%', height: '100%' }}
              className="w-full h-full"
              opacity={0}
              hideHeaders
              hideFooter
            />
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
      `}</style>
    </>
  );
};

export default SubmitModal;
