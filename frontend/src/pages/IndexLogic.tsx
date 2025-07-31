import React, { useState, useRef, useEffect } from 'react';
import IndexUI from './IndexUI';
import { useToast } from '@/hooks/use-toast';

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

const BACKEND_URL = 'http://localhost:5000/api/messages';

const loadChatsFromLocalStorage = (): Chat[] => {
  const savedChats = localStorage.getItem('aiSupportChats');
  if (savedChats) {
    try {
      const parsed = JSON.parse(savedChats);
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

const IndexLogic = () => {
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
            text: "Hello! I'm your AI customer support assistant...",
            isUser: false,
            timestamp: new Date(),
          }],
          uploadedFiles: []
        }];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    const savedChats = loadChatsFromLocalStorage();
    const savedChatId = localStorage.getItem('aiSupportCurrentChatId');
    const isValidChat = savedChats.find(chat => chat.id === savedChatId);
    return isValidChat?.id || savedChats[0]?.id;
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [temperature] = useState(0.7);
  const [hasStartedChat, setHasStartedChat] = useState(() => {
    const savedChats = loadChatsFromLocalStorage();
    const savedChatId = localStorage.getItem('aiSupportCurrentChatId');
    const chat = savedChats.find(chat => chat.id === savedChatId);
    return chat?.messages.length > 1;
  });
  const [suggestions] = useState([
    "How can I reset my password?",
    "What's your refund policy?",
    "Show me recent transactions",
    "Explain your premium features"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    saveChatsToLocalStorage(chats);
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('aiSupportCurrentChatId', currentChatId);
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId]);

  const saveMessageToMongo = async (chatId: string, message: Message) => {
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          text: message.text,
          isUser: message.isUser,
          timestamp: message.timestamp
        })
      });
    } catch (error) {
      console.error('MongoDB save error:', error);
    }
  };

  const callGeminiAPI = async (userMessage: string, context = '', retries = 3, model = aiModel): Promise<string> => {
    const API_KEY = 'AIzaSyCrDaoyJTvRJ2ZwxPjzA-b3xDqCIQGATWY';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const prompt = context 
      ? `Context from uploaded documents: ${context}\n\nUser question: ${userMessage}`
      : userMessage;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            topP: 0.9,
            topK: 40
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API Error');

      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Empty response.";
    } catch (err) {
      console.error('Gemini API error:', err);
      return "Something went wrong. Please try again.";
    }
  };

  const getAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    try {
      const currentChat = chats.find(chat => chat.id === currentChatId);
      const context = currentChat?.uploadedFiles.map(file =>
        `File: ${file.name}\nContent: ${file.content.substring(0, 5000)}`
      ).join('\n\n') || '';

      let aiResponse = await callGeminiAPI(userMessage, context);
      const newMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat =>
        chat.id === currentChatId 
          ? { ...chat, messages: [...chat.messages, newMessage] } 
          : chat
      ));

      await saveMessageToMongo(currentChatId, newMessage);

    } catch (err) {
      toast({ title: "AI Error", description: "Failed to get AI response", variant: "destructive" });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && pendingFiles.length === 0) return;

    if (!hasStartedChat) setHasStartedChat(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue || 'Uploaded files',
      isUser: true,
      timestamp: new Date(),
      files: pendingFiles.length > 0 ? pendingFiles : undefined
    };

    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? {
            ...chat,
            messages: [...chat.messages, userMessage],
            uploadedFiles: pendingFiles.length > 0 ? [...chat.uploadedFiles, ...pendingFiles] : chat.uploadedFiles,
            title: chat.messages.length <= 1 && inputValue
              ? inputValue.substring(0, 30) + (inputValue.length > 30 ? '...' : '')
              : chat.title
          }
        : chat
    ));

    await saveMessageToMongo(currentChatId, userMessage);

    setInputValue('');
    setPendingFiles([]);
    await getAIResponse(inputValue || 'Files uploaded.');
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
        title: "Limit exceeded",
        description: "Max 5 files",
        variant: "destructive"
      });
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPendingFiles(prev => [...prev, {
          name: file.name,
          content: content.substring(0, 5000),
          type: file.type.split('/')[0] || 'file'
        }]);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
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
              msg.id === id ? { ...msg, isFavorite: !msg.isFavorite } : msg
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
        text: "Hello! I'm your AI customer support assistant...",
        isUser: false,
        timestamp: new Date()
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
      toast({ title: "Cannot delete", description: "At least one chat required", variant: "destructive" });
      return;
    }
    const updatedChats = chats.filter(chat => chat.id !== id);
    setChats(updatedChats);

    if (currentChatId === id) {
      const newCurrentId = updatedChats[0].id;
      setCurrentChatId(newCurrentId);
      localStorage.setItem('aiSupportCurrentChatId', newCurrentId);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    if (!hasStartedChat) setHasStartedChat(true);
  };

  return (
    <IndexUI
      chats={chats}
      currentChatId={currentChatId}
      inputValue={inputValue}
      isTyping={isTyping}
      pendingFiles={pendingFiles}
      isMobileMenuOpen={isMobileMenuOpen}
      isSidebarCollapsed={isSidebarCollapsed}
      hasStartedChat={hasStartedChat}
      suggestions={suggestions}
      messagesEndRef={messagesEndRef}
      fileInputRef={fileInputRef}
      setInputValue={setInputValue}
      setCurrentChatId={setCurrentChatId}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      setIsSidebarCollapsed={setIsSidebarCollapsed}
      setPendingFiles={setPendingFiles}
      createNewChat={createNewChat}
      deleteChat={deleteChat}
      handleSendMessage={handleSendMessage}
      handleKeyPress={handleKeyPress}
      handleFileUpload={handleFileUpload}
      removePendingFile={removePendingFile}
      toggleFavoriteMessage={toggleFavoriteMessage}
      handleSuggestionClick={handleSuggestionClick}
    />
  );
};

export default IndexLogic;
