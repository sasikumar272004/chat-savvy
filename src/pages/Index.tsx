import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Upload, 
  FileText, 
  Settings,
  MessageCircle,
  Zap,
  Brain,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface Document {
  id: string;
  name: string;
  content: string;
  uploadedAt: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Welcome to Neural Support! I'm your AI assistant powered by advanced language models. I can help you with any questions using our knowledge base. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiResponse = `I understand you're asking about "${userMessage}". Based on our knowledge base and advanced AI processing, I can help you with that. This is a simulated response that would normally come from your integrated LLM API (OpenAI, Gemini, Claude, etc.). The system will analyze uploaded documents and FAQs to provide contextually relevant answers.`;
    
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
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    await simulateAIResponse(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newDoc: Document = {
          id: Date.now().toString(),
          name: file.name,
          content: content.substring(0, 1000) + '...', // Truncate for display
          uploadedAt: new Date(),
        };
        setDocuments(prev => [...prev, newDoc]);
      };
      reader.readAsText(file);
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-4">
      <Avatar className="w-8 h-8 neural-glow">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-surface rounded-2xl px-4 py-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-neural-blue/10 via-neural-purple/5 to-neural-pink/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <Card className="mb-6 neural-glow border-0 bg-surface/80 backdrop-blur-xl">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 neural-gradient rounded-xl flex items-center justify-center floating">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Neural Support AI
                  </h1>
                  <p className="text-muted-foreground">Advanced Customer Support Assistant</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="neural-glow">
                  <Zap className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
                <Badge variant="outline" className="border-primary/30">
                  <Clock className="w-3 h-3 mr-1" />
                  24/7 Available
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="flex-1 flex gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-surface/80 backdrop-blur-xl">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="docs" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Knowledge Base
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 mt-6">
              <Card className="h-full flex flex-col neural-glow border-0 bg-surface/80 backdrop-blur-xl">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-start gap-3 message-enter",
                          message.isUser ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <Avatar className={cn(
                          "w-8 h-8",
                          message.isUser ? "bg-accent" : "neural-glow"
                        )}>
                          <AvatarFallback className={cn(
                            message.isUser 
                              ? "bg-accent text-accent-foreground" 
                              : "bg-primary text-primary-foreground"
                          )}>
                            {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3 shadow-lg",
                          message.isUser
                            ? "bg-accent text-accent-foreground ml-auto"
                            : "bg-surface border border-border/50"
                        )}>
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p className="text-xs opacity-60 mt-2">
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

                {/* Input Area */}
                <div className="p-6">
                  <div className="flex gap-3">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-background/50 border-border/50 focus:border-primary transition-all duration-300 neural-glow"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      size="icon"
                      className="neural-gradient hover:scale-105 transition-transform duration-200"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="flex-1 mt-6">
              <Card className="h-full neural-glow border-0 bg-surface/80 backdrop-blur-xl">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload Knowledge Base Documents
                  </h3>
                  <div 
                    className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
                    <p className="text-muted-foreground">Support for .txt, .md, .pdf files</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.md,.pdf"
                    className="hidden"
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="flex-1 mt-6">
              <Card className="h-full neural-glow border-0 bg-surface/80 backdrop-blur-xl">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Uploaded Documents ({documents.length})
                  </h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {documents.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No documents uploaded yet. Upload some files in the Admin tab to enhance AI responses.
                        </p>
                      ) : (
                        documents.map((doc) => (
                          <Card key={doc.id} className="p-4 bg-background/50 border-border/50">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{doc.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Uploaded {doc.uploadedAt.toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                  {doc.content}
                                </p>
                              </div>
                              <Badge variant="outline" className="border-primary/30">
                                Active
                              </Badge>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;