"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Users, Share2, MessageSquare, UserPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type CollaborationPanelProps = {
  className?: string;
  onClose: () => void;
  path?: string;
};

type CollaborationUser = {
  id: string;
  name: string;
  color: string;
  position?: { line: number; column: number };
  active: boolean;
  lastActive: Date;
};

export function CollaborationPanel({ className, onClose, path }: CollaborationPanelProps) {
  const [isInviting, setIsInviting] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState("");
  const [chatMessage, setChatMessage] = React.useState("");
  const [chatMessages, setChatMessages] = React.useState<Array<{user: string; message: string; time: Date}>>([]);
  
  // Mock users for demonstration
  const [users, setUsers] = React.useState<CollaborationUser[]>([
    { id: "1", name: "You", color: "#3b82f6", position: { line: 1, column: 1 }, active: true, lastActive: new Date() },
    { id: "2", name: "John Doe", color: "#10b981", position: { line: 15, column: 5 }, active: true, lastActive: new Date() },
    { id: "3", name: "Alice Smith", color: "#f59e0b", active: false, lastActive: new Date(Date.now() - 10 * 60 * 1000) }
  ]);

  const handleInvite = () => {
    setIsInviting(true);
    // Generate a mock invite link
    setInviteLink(`https://qasly-labs.com/collaborate/${Math.random().toString(36).substring(2, 10)}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    // Show a toast or some feedback
    alert("Link copied to clipboard!");
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setChatMessages(prev => [
      ...prev,
      { user: "You", message: chatMessage, time: new Date() }
    ]);
    
    // Simulate response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { user: "John Doe", message: "Thanks for the update!", time: new Date() }
      ]);
    }, 2000);
    
    setChatMessage("");
  };

  return (
    <div className={cn("w-64 border-l bg-background/95 flex flex-col h-full", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Users className="size-4 text-primary" />
          Collaboration
        </h3>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          &times;
        </button>
      </div>
      
      {/* File info */}
      <div className="px-3 py-2 border-b">
        <div className="text-xs text-muted-foreground">Current file:</div>
        <div className="text-sm truncate font-medium">{path || "No file selected"}</div>
      </div>
      
      {/* Active users */}
      <div className="p-3 border-b">
        <h4 className="text-xs font-medium mb-2">Active Users ({users.filter(u => u.active).length})</h4>
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className={cn(
                    "size-2 rounded-full", 
                    user.active ? "bg-green-500" : "bg-gray-400"
                  )} 
                  style={{ backgroundColor: user.color }}
                />
                <span>{user.name}</span>
              </div>
              {user.active ? (
                <span className="text-xs text-muted-foreground">
                  {user.position ? `Line ${user.position.line}` : "Viewing"}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {Math.round((Date.now() - user.lastActive.getTime()) / 60000)}m ago
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Invite section */}
      <div className="p-3 border-b">
        {isInviting ? (
          <div className="space-y-2">
            <div className="text-xs font-medium mb-1">Share this link:</div>
            <div className="flex items-center gap-1">
              <input 
                type="text" 
                value={inviteLink} 
                readOnly 
                className="flex-1 text-xs bg-muted p-1 rounded border" 
              />
              <Button size="sm" variant="outline" onClick={handleCopyLink} className="h-6 text-xs">
                Copy
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            size="sm" 
            onClick={handleInvite} 
            className="w-full text-xs flex items-center gap-1"
          >
            <UserPlus className="size-3.5" />
            Invite Collaborator
          </Button>
        )}
      </div>
      
      {/* Chat section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-2 border-b">
          <h4 className="text-xs font-medium flex items-center gap-1.5">
            <MessageSquare className="size-3.5" />
            Chat
          </h4>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {chatMessages.length > 0 ? (
            chatMessages.map((msg, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{msg.user}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-0.5">{msg.message}</p>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No messages yet
            </div>
          )}
        </div>
        
        <div className="p-2 border-t">
          <div className="flex items-center gap-1">
            <input 
              type="text" 
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-xs p-1.5 rounded border bg-muted"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage} 
              disabled={!chatMessage.trim()}
              className="h-6 text-xs"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
