import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Bot, 
  User, 
  Paperclip,
  MessageCircle,
  X,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  files?: { name: string; content: string }[];
}

interface UploadedFile {
  name: string;
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI customer support assistant. I can help you with any questions and I'll use any documents you upload to provide better answers. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callGeminiAPI = async (userMessage: string, context: string = '') => {
    const API_KEY = 'AIzaSyDnwJZAlISIaUvPafK-GIbCiZ0FxeI1Gb4';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "I'm sorry, there was an error processing your request. Please try again.";
    }
  };

  const getAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    // Create context from uploaded files
    const context = uploadedFiles.map(file => 
      `File: ${file.name}\nContent: ${file.content}`
    ).join('\n\n');
    
    const aiResponse = await callGeminiAPI(userMessage, context);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: aiResponse,
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && pendingFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue || 'Uploaded files',
      isUser: true,
      timestamp: new Date(),
      files: pendingFiles.length > 0 ? pendingFiles : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Add pending files to uploaded files
    if (pendingFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...pendingFiles]);
      setPendingFiles([]);
      toast({
        title: "Files uploaded",
        description: `${pendingFiles.length} file(s) added to knowledge base`,
      });
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
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile: UploadedFile = {
          name: file.name,
          content: content.substring(0, 5000), // Limit content length
        };
        setPendingFiles(prev => [...prev, newFile]);
      };
      reader.readAsText(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-3 p-4">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-card rounded-lg px-4 py-2 border">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <Card className="mb-4 border-border/50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AI Customer Support</h1>
                  <p className="text-sm text-muted-foreground">
                    Powered by Gemini AI
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {uploadedFiles.length} documents
                </Badge>
                <Badge variant="outline" className="text-green-400 border-green-400/50">
                  Online
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col border-border/50">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 message-enter",
                    message.isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={cn(
                      message.isUser 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-primary text-primary-foreground"
                    )}>
                      {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2",
                    message.isUser
                      ? "bg-accent text-accent-foreground ml-auto"
                      : "bg-card border border-border/50"
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.files.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs opacity-70">
                            <FileText className="w-3 h-3" />
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator className="bg-border/50" />

          {/* Pending Files Display */}
          {pendingFiles.length > 0 && (
            <div className="p-3 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-2">Files to upload:</div>
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-card rounded px-2 py-1 text-xs border">
                    <FileText className="w-3 h-3" />
                    <span>{file.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4"
                      onClick={() => removePendingFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4">
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
                disabled={isTyping}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or upload files..."
                className="flex-1"
                disabled={isTyping}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.md,.pdf,.doc,.docx"
              multiple
              className="hidden"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;