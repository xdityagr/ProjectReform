import { useState } from 'react';
import PlannerActionsModal from '../PlannerActionsModal';
import { Button } from '@/components/ui/button';

export default function PlannerActionsModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Planner Actions</Button>
      <PlannerActionsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        location={[75.8267, 26.9124]}
        onAction={(action) => {
          console.log('Action selected:', action);
          setIsOpen(false);
        }}
      />
    </div>
  );
}
