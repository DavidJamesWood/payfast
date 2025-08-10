import { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../lib/api';

interface Message {
  id: string;
  query: string;
  summary: string;
  mcp_result: {
    success: boolean;
    data?: any[];
    row_count?: number;
    execution_time?: number;
  };
  corrections_made: number;
  final_success: boolean;
  timestamp: Date;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickPrompts = [
  "Top mismatches",
  "Cluster causes", 
  "What changed last period?",
  "Employee count by status",
  "Recent payroll batches",
  "Reconciliation summary"
];

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      query,
      summary: '',
      mcp_result: { success: false },
      corrections_made: 0,
      final_success: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);
    setCurrentRequestId(messageId);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await apiClient.llmOrchestrate({
        query,
        self_correct: true,
        include_summary: true,
        max_retries: 2
      }, abortControllerRef.current.signal);

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...response }
          : msg
      ));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                summary: 'Query cancelled by user',
                final_success: false 
              }
            : msg
        ));
      } else {
        console.error('Chat error:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                final_success: false 
              }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      setCurrentRequestId(null);
      abortControllerRef.current = null;
    }
  };

  const handleCancelQuery = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleClearChat = () => {
    if (messages.length > 0 && window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      setExpandedMessages(new Set());
      setInputValue('');
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-[9999] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        </div>
        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Clear chat"
            >
              <TrashIcon className="h-4 w-4 text-gray-500" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Ask me anything about your payroll data!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm">{message.query}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-xs">
                  {/* Summary */}
                  <div className="mb-2">
                    {message.summary ? (
                      <div className="text-sm text-gray-900">
                        {message.summary.split('\n').map((line, index) => (
                          <p key={index} className={index > 0 ? 'mt-2' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {isLoading && currentRequestId === message.id ? 'Thinking...' : 'No response'}
                      </p>
                    )}
                  </div>

                  {/* Results Table */}
                  {message.mcp_result.success && message.mcp_result.data && message.mcp_result.data.length > 0 && (
                    <div className="mb-2">
                      <button
                        onClick={() => toggleMessageExpansion(message.id)}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {expandedMessages.has(message.id) ? (
                          <ChevronUpIcon className="h-3 w-3" />
                        ) : (
                          <ChevronDownIcon className="h-3 w-3" />
                        )}
                        <span>
                          {expandedMessages.has(message.id) ? 'Hide' : 'Show'} Results 
                          ({message.mcp_result.row_count} rows)
                        </span>
                      </button>

                      {expandedMessages.has(message.id) && (
                        <div className="mt-2 overflow-x-auto">
                          <table className="text-xs border border-gray-300">
                            <thead>
                              <tr className="bg-gray-50">
                                {Object.keys(message.mcp_result.data[0]).map((key) => (
                                  <th key={key} className="px-2 py-1 text-left border-b border-gray-300">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {message.mcp_result.data.slice(0, 50).map((row, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                  {Object.values(row).map((value, cellIndex) => (
                                    <td key={cellIndex} className="px-2 py-1">
                                      {String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {message.mcp_result.data.length > 50 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Showing first 50 of {message.mcp_result.data.length} rows
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {message.corrections_made > 0 && `Corrections: ${message.corrections_made}`}
                    </span>
                    {message.mcp_result.execution_time && (
                      <span>{message.mcp_result.execution_time}s</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 mb-4">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Ask about your payroll data..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            {isLoading ? (
              <button
                onClick={handleCancelQuery}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Cancel query"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
