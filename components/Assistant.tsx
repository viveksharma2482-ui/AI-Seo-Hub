import React, { useState, useEffect, useRef } from 'react';
import { chatWithAssistant } from '../services/gemini';
import { ChatMessage } from '../types';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AssistantProps {
  initialMessage?: string;
}

export const Assistant: React.FC<AssistantProps> = ({ initialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Hello! I am your SEO Assistant. I can help you fix technical issues, write meta tags, or explain complex SEO concepts. How can I help you today?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Convert internal message format to Gemini history format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await chatWithAssistant(history, text);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm sorry, I encountered an error. Please check your connection or API key.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-slate-800 ml-3' : 'bg-brand-600 mr-3'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-100 text-slate-800 rounded-tr-none' 
                  : 'bg-brand-50 text-slate-800 rounded-tl-none border border-brand-100'
              }`}>
                {msg.role === 'model' ? (
                   <div className="prose prose-sm prose-slate max-w-none">
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                   </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start">
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-600 mr-3 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
             </div>
             <div className="bg-brand-50 p-4 rounded-2xl rounded-tl-none border border-brand-100">
               <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me how to fix a redirect chain..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
          />
          <button
            type="submit"
            disabled={!input || isTyping}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
