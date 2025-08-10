import { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ChatDrawer from './ChatDrawer';

export default function ChatTest() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          PayFast Chat Drawer Test
        </h1>
        <p className="text-gray-600 mb-8">
          Click the button below to test the AI Chat drawer
        </p>
        
        <button
          onClick={() => setIsChatOpen(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          <span>Open AI Chat</span>
        </button>

        {/* Chat Drawer */}
        {isChatOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsChatOpen(false)}
          />
        )}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </div>
  );
}
