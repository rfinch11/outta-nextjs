'use client';

import React from 'react';
import { IoMdClose } from 'react-icons/io';

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
          <div className="absolute top-0 right-0 z-10 px-6 pt-6 pb-4">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
              aria-label="Close"
              type="button"
            >
              <IoMdClose size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Airtable Form Embed */}
          <div className="w-full h-full overflow-hidden relative">
            <iframe
              className="airtable-embed w-full h-full border-0"
              src="https://airtable.com/embed/appNEwC9kmw1NTshd/pagOOlOxjijSp6rln/form"
              style={{ background: 'transparent' }}
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
