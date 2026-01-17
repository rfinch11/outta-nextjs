'use client';

import React from 'react';
import { ResponsiveModal } from './ui/ResponsiveModal';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose }) => {
  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Submit an Event"
      description="Submit a new event, activity, or camp"
      snapPoints={[0.9, 1]}
      maxWidth="max-w-xl"
    >
      {/* Airtable Form Embed */}
      <div className="w-full h-[70vh] md:h-[60vh] -mx-4 md:-mx-6 -mb-4 md:-mb-6">
        <iframe
          className="airtable-embed w-full h-full border-0"
          src="https://airtable.com/embed/appNEwC9kmw1NTshd/pagOOlOxjijSp6rln/form"
          style={{ background: 'transparent' }}
          title="Submit an event form"
        />
      </div>
    </ResponsiveModal>
  );
};

export default SubmitModal;
