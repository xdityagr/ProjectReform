import { useState } from 'react';
import AIChatPanel from '../AIChatPanel';
import { Button } from '@/components/ui/button';

export default function AIChatPanelExample() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-screen">
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open AI Chat</Button>
      </div>
      <AIChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMinimize={() => console.log('Minimize chat')}
      />
    </div>
  );
}
