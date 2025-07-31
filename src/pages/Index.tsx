import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Bot, 
  User, 
  Paperclip,
  MessageCircle,
  X,
  FileText,
  Menu,
  Settings,
  Plus,
  Lightbulb,
  Share2,
  Image as ImageIcon,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  files?: { name: string; content: string; type: string }[];
  isFavorite?: boolean;
}

interface UploadedFile {
  name: string;
  content: string;
  type: string;
}

interface Chat {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
  uploadedFiles: UploadedFile[];
}

// Helper functions for localStorage
const loadChatsFromLocalStorage = (): Chat[] => {
  const savedChats = localStorage.getItem('aiSupportChats');
  if (savedChats) {
    try {
      const parsed = JSON.parse(savedChats);
      // Convert string dates back to Date objects
      return parsed.map((chat: any) => ({
        ...chat,
        date: new Date(chat.date),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (e) {
      console.error("Failed to parse saved chats", e);
      return [];
    }
  }
  return [];
};

const saveChatsToLocalStorage = (chats: Chat[]) => {
  localStorage.setItem('aiSupportChats', JSON.stringify(chats));
};

const Index = () => {
  const [chats, setChats] = useState<Chat[]>(() => {
    const savedChats = loadChatsFromLocalStorage();
    return savedChats.length > 0 
      ? savedChats 
      : [{
          id: '1',
          title: 'New Conversation',
          date: new Date(),
          messages: [{
            id: '1',
            text: "Hello! I'm your AI customer support assistant. I can help you with any questions and I'll use any documents you upload to provide better answers. How can I help you today?",
            isUser: false,
            timestamp: new Date(),
          }],
          uploadedFiles: []
        }];
  });
  const [currentChatId, setCurrentChatId] = useState(chats[0].id);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [hasStartedChat, setHasStartedChat] = useState(chats[0].messages.length > 1);
  const [suggestions] = useState([
    "How can I reset my password?",
    "What's your refund policy?",
    "Show me recent transactions",
    "Explain your premium features"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentChat = chats.find(chat => chat.id === currentChatId) || chats[0];
  const messages = currentChat?.messages || [];
  const uploadedFiles = currentChat?.uploadedFiles || [];

  // Save chats to localStorage whenever they change
  useEffect(() => {
    saveChatsToLocalStorage(chats);
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callGeminiAPI = async (userMessage: string, context: string = '', retries = 3, model = aiModel): Promise<string> => {
    const API_KEY = 'AIzaSyCrDaoyJTvRJ2ZwxPjzA-b3xDqCIQGATWY';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const prompt = context 
      ? `Context from uploaded documents: ${context}\n\nUser question: ${userMessage}\n\nPlease provide a helpful response based on the context above and your knowledge.`
      : userMessage;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature,
            topP: 0.9,
            topK: 40
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', data);
        if ((response.status === 429 || response.status === 503 || data.error?.message?.toLowerCase().includes('overloaded')) && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          return callGeminiAPI(userMessage, context, retries - 1, model);
        }
        throw new Error(data.error?.message || `API Error: ${response.status}`);
      }

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      if (data.text) {
        return data.text;
      }

      console.warn('Unexpected API response structure:', data);
      return "I received an unexpected response format. Please try again.";

    } catch (error: any) {
      console.error('Error calling Gemini API:', error);

      if (error.message.includes('quota')) {
        return "I've reached my usage limit. Please try again later or check your API quota.";
      }

      if (error.message.includes('API key')) {
        return "There's an issue with the API configuration. Please check your API key.";
      }

      if (error.message.includes('overloaded') || error.message.includes('503')) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          return callGeminiAPI(userMessage, context, retries - 1, model);
        }
        return "The AI is currently overloaded with requests. Please try again in a moment.";
      }

      return "I'm having trouble processing your request. Please try again later.";
    }
  };

  const getAIResponse = async (userMessage: string) => {
    setIsTyping(true);

    try {
      const context = uploadedFiles.map(file => 
        `File: ${file.name}\nContent: ${file.content.substring(0, 5000)}`
      ).join('\n\n');

      let aiResponse = await callGeminiAPI(userMessage, context, 3, aiModel);

      const fallbackModels = ['gemini-1.5-pro', 'gemini-1.0-ultra'];

      for (const fallbackModel of fallbackModels) {
        if (aiResponse.includes('overloaded') && fallbackModel !== aiModel) {
          toast({
            title: "Switching models",
            description: `Falling back to ${fallbackModel} due to high load`,
          });
          aiResponse = await callGeminiAPI(userMessage, context, 3, fallbackModel);
        }
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      ));
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && pendingFiles.length === 0) return;

    if (!hasStartedChat) {
      setHasStartedChat(true);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue || 'Uploaded files',
      isUser: true,
      timestamp: new Date(),
      files: pendingFiles.length > 0 ? pendingFiles : undefined,
    };

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            uploadedFiles: pendingFiles.length > 0 
              ? [...chat.uploadedFiles, ...pendingFiles] 
              : chat.uploadedFiles,
            title: chat.messages.length <= 1 && inputValue 
              ? inputValue.substring(0, 30) + (inputValue.length > 30 ? '...' : '')
              : chat.title
          }
        : chat
    ));
    
    if (pendingFiles.length > 0) {
      toast({
        title: "Files uploaded",
        description: `${pendingFiles.length} file(s) added to knowledge base`,
      });
      setPendingFiles([]);
    }
    
    const messageToSend = inputValue || `I've uploaded ${pendingFiles.length} file(s). Please acknowledge this.`;
    setInputValue('');
    
    await getAIResponse(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + pendingFiles.length > 5) {
      toast({
        title: "Too many files",
        description: "You can upload up to 5 files at a time",
        variant: "destructive"
      });
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const fileType = file.type.split('/')[0] || 'file';
        const newFile: UploadedFile = {
          name: file.name,
          content: content.substring(0, 5000),
          type: fileType
        };
        setPendingFiles(prev => [...prev, newFile]);
      };
      reader.onerror = () => {
        toast({
          title: "File error",
          description: `Could not read file: ${file.name}`,
          variant: "destructive"
        });
      };
      reader.readAsText(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFavoriteMessage = (id: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId
        ? {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === id ? {...msg, isFavorite: !msg.isFavorite} : msg
            )
          }
        : chat
    ));
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: 'New Conversation',
      date: new Date(),
      messages: [{
        id: '1',
        text: "Hello! I'm your AI customer support assistant. I can help you with any questions and I'll use any documents you upload to provide better answers. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      }],
      uploadedFiles: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setHasStartedChat(false);
    setIsMobileMenuOpen(false);
  };

  const deleteChat = (id: string) => {
    if (chats.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one chat",
        variant: "destructive"
      });
      return;
    }
    
    setChats(prev => prev.filter(chat => chat.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(chats[0].id);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-3 p-4">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted/50 rounded-lg px-4 py-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

  const FileIcon = ({ type }: { type: string }) => {
    switch(type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'application': return <FileText className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  