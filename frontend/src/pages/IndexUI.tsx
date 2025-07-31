import * as React from 'react';
import { RefObject } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


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

interface IndexUIProps {
  chats: Chat[];
  currentChatId: string;
  inputValue: string;
  isTyping: boolean;
  pendingFiles: UploadedFile[];
  isMobileMenuOpen: boolean;
  isSidebarCollapsed: boolean;
  hasStartedChat: boolean;
  suggestions: string[];
  messagesEndRef: RefObject<HTMLDivElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  setInputValue: (value: string) => void;
  setCurrentChatId: (id: string) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  setPendingFiles: (files: UploadedFile[]) => void;
  createNewChat: () => void;
  deleteChat: (id: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePendingFile: (index: number) => void;
  toggleFavoriteMessage: (id: string) => void;
  handleSuggestionClick: (suggestion: string) => void;
}

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

const IndexUI: React.FC<IndexUIProps> = ({
  chats,
  currentChatId,
  inputValue,
  isTyping,
  pendingFiles,
  isMobileMenuOpen,
  isSidebarCollapsed,
  hasStartedChat,
  suggestions,
  messagesEndRef,
  fileInputRef,
  setInputValue,
  setCurrentChatId,
  setIsMobileMenuOpen,
  setIsSidebarCollapsed,
  setPendingFiles,
  createNewChat,
  deleteChat,
  handleSendMessage,
  handleKeyPress,
  handleFileUpload,
  removePendingFile,
  toggleFavoriteMessage,
  handleSuggestionClick,
}) => {
  const currentChat = chats.find(chat => chat.id === currentChatId) || chats[0];
  const messages = currentChat?.messages || [];
  const uploadedFiles = currentChat?.uploadedFiles || [];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className={cn(
        "hidden md:flex flex-col border-r border-border/20 bg-background h-screen sticky top-0 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className={cn(
          "p-4 border-b border-border/20 flex items-center",
          isSidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold">AI Support</h1>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarCollapsed(true)}
                className="h-8 w-8 hover:bg-muted/50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarCollapsed(false)}
              className="h-10 w-10 hover:bg-muted/50"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        {/* New Chat Button */}
        <Button 
          variant="ghost" 
          className={cn(
            "mx-4 mt-4 mb-2 bg-primary/5 hover:bg-primary/10 text-primary",
            isSidebarCollapsed ? "px-0 justify-center" : "justify-start"
          )}
          onClick={createNewChat}
        >
          <Plus className="w-4 h-4" />
          {!isSidebarCollapsed && <span className="ml-2">New Chat</span>}
        </Button>
        
        {/* Chat History Section */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1">
            {chats.map(chat => (
              <div key={chat.id} className="relative group">
                <Button 
                  variant={currentChatId === chat.id ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start text-sm hover:bg-muted/50",
                    isSidebarCollapsed ? "px-2" : "pr-10",
                    currentChatId === chat.id ? "bg-muted/50" : ""
                  )}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setHasStartedChat(chat.messages.length > 1);
                  }}
                >
                  {isSidebarCollapsed ? (
                    <span className="truncate">{chat.title.charAt(0)}</span>
                  ) : (
                    <span className="truncate">{chat.title}</span>
                  )}
                </Button>
                {chats.length > 1 && !isSidebarCollapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Bottom Settings */}
        <div className="p-4 border-t border-border/20">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              isSidebarCollapsed ? "px-0 justify-center" : "justify-start"
            )}
          >
            <Settings className="w-4 h-4" />
            {!isSidebarCollapsed && <span className="ml-2">Settings</span>}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-border/20 flex items-center justify-between bg-background">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="hover:bg-muted/50"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">AI Support</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={createNewChat}
            className="hover:bg-muted/50"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border/20 p-4">
            <div className="space-y-1">
              {chats.map(chat => (
                <div key={chat.id} className="relative group">
                  <Button 
                    variant={currentChatId === chat.id ? "secondary" : "ghost"} 
                    className="w-full justify-start text-sm pr-10 hover:bg-muted/50"
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      setHasStartedChat(chat.messages.length > 1);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="truncate">{chat.title}</span>
                  </Button>
                  {chats.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-muted/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        )}
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!hasStartedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Ask me anything or upload documents for me to reference. I can help with questions, analysis, and more.
              </p>
              
              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestions.map((suggestion, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="text-left h-auto py-3 justify-start whitespace-normal hover:bg-muted/50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Lightbulb className="w-4 h-4 mr-2 text-primary" />
                    <span>{suggestion}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-start gap-4 message-enter group",
                        message.isUser ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className={cn(
                          message.isUser 
                            ? "bg-muted text-foreground" 
                            : "bg-primary/10 text-primary"
                        )}>
                          {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3 relative",
                        message.isUser
                          ? "bg-primary/5 border border-primary/10"
                          : "bg-muted/50 border border-border/20"
                      )}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 hover:bg-muted/50"
                                  onClick={() => toggleFavoriteMessage(message.id)}
                                >
                                  <Star className={cn(
                                    "w-3 h-3",
                                    message.isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                                  )} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {message.isFavorite ? "Remove favorite" : "Add to favorites"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted/50">
                                  <Share2 className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Share message</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap pr-6">{message.text}</p>
                        
                        {message.files && message.files.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.files.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs p-2 rounded bg-background/50 border border-border/20">
                                <FileIcon type={file.type} />
                                <span className="truncate">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </>
          )}

          {/* Pending Files Display */}
          {pendingFiles.length > 0 && (
            <div className="p-3 bg-muted/10 border-t border-border/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">Files to upload ({pendingFiles.length}/5):</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs hover:bg-muted/50"
                  onClick={() => setPendingFiles([])}
                >
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background rounded px-3 py-1.5 text-xs border border-border/20">
                    <FileIcon type={file.type} />
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 hover:bg-muted/50"
                      onClick={() => removePendingFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area - Enhanced like Deepseek */}
          <div className="p-4 border-t border-border/20 bg-background/80 backdrop-blur-sm">
            <div className="relative">
              <div className="flex items-center rounded-lg border border-border/20 bg-muted/10 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="min-h-[60px] pr-16 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isTyping}
                  rows={1}
                />
                
                <div className="absolute right-2 bottom-10 flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted/50 text-muted-foreground"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isTyping || pendingFiles.length >= 5}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach files</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button
                    size="icon"
                    className={cn(
                      "h-8 w-8 transition-all",
                      inputValue.trim() || pendingFiles.length > 0 
                        ? "bg-primary hover:bg-primary/90 text-white" 
                        : "bg-muted/50 text-muted-foreground"
                    )}
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
                <span>Supports text, PDF, Word, and more</span>
                <Badge variant="outline" className="flex items-center gap-1 bg-muted/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Gemini 1.5 Flash
                </Badge>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".txt,.md,.pdf,.doc,.docx,.csv,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                multiple
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexUI;
