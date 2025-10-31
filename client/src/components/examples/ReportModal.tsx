import { useState } from 'react';
import ReportModal from '../ReportModal';
import { Button } from '@/components/ui/button';

export default function ReportModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Report Modal</Button>
      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        location={[75.8267, 26.9124]}
        onSubmit={(report) => {
          console.log('Report submitted:', report);
          setIsOpen(false);
        }}
      />
    </div>
  );
}
