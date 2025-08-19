/**
 * Free Conversation Memory System
 * Uses localStorage and simple compression for conversation persistence
 */

export interface ConversationContext {
  id: string;
  title: string;
  fileContext?: {
    path: string;
    language: string;
    lastModified: number;
  };
  messages: ChatMessage[];
  summary?: string;
  insights: Insight[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    reasoning?: ReasoningStep[];
    confidence?: number;
    provider?: string;
    model?: string;
  };
}

export interface Insight {
  type: 'vulnerability' | 'pattern' | 'suggestion' | 'learning';
  title: string;
  content: string;
  confidence: number;
  relatedFiles: string[];
  timestamp: number;
}

export interface ReasoningStep {
  step: number;
  title: string;
  content: string;
  confidence: number;
  type: 'analysis' | 'synthesis' | 'validation' | 'conclusion';
}

export class ConversationMemory {
  private readonly STORAGE_KEY = 'qasly_conversations';
  private readonly MAX_CONVERSATIONS = 50; // Free tier limit
  private readonly MAX_MESSAGES_PER_CONVERSATION = 100;
  
  // Get all conversations
  getAllConversations(): ConversationContext[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const conversations = JSON.parse(stored) as ConversationContext[];
      return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }
  
  // Get specific conversation
  getConversation(id: string): ConversationContext | null {
    const conversations = this.getAllConversations();
    return conversations.find(c => c.id === id) || null;
  }
  
  // Create new conversation
  createConversation(title: string, fileContext?: ConversationContext['fileContext']): ConversationContext {
    const conversation: ConversationContext = {
      id: this.generateId(),
      title,
      fileContext,
      messages: [],
      insights: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.saveConversation(conversation);
    return conversation;
  }
  
  // Add message to conversation
  addMessage(
    conversationId: string, 
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): ConversationContext | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return null;
    
    const newMessage: ChatMessage = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now()
    };
    
    conversation.messages.push(newMessage);
    conversation.updatedAt = Date.now();
    
    // Trim old messages if limit exceeded
    if (conversation.messages.length > this.MAX_MESSAGES_PER_CONVERSATION) {
      const removedMessages = conversation.messages.splice(0, conversation.messages.length - this.MAX_MESSAGES_PER_CONVERSATION);
      
      // Generate summary of removed content
      if (!conversation.summary) {
        conversation.summary = this.generateSummary(removedMessages);
      }
    }
    
    // Extract insights from new message
    if (message.role === 'assistant') {
      const insights = this.extractInsights(message.content);
      conversation.insights.push(...insights);
      
      // Limit insights
      if (conversation.insights.length > 20) {
        conversation.insights = conversation.insights.slice(-20);
      }
    }
    
    this.saveConversation(conversation);
    return conversation;
  }
  
  // Update conversation title
  updateTitle(conversationId: string, title: string): boolean {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return false;
    
    conversation.title = title;
    conversation.updatedAt = Date.now();
    this.saveConversation(conversation);
    return true;
  }
  
  // Delete conversation
  deleteConversation(conversationId: string): boolean {
    const conversations = this.getAllConversations();
    const filteredConversations = conversations.filter(c => c.id !== conversationId);
    
    if (filteredConversations.length === conversations.length) return false;
    
    this.saveConversations(filteredConversations);
    return true;
  }
  
  // Get conversation context for AI
  getContextForAI(conversationId: string, maxMessages: number = 10): string {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return '';
    
    let context = '';
    
    // Add file context
    if (conversation.fileContext) {
      context += `File Context: ${conversation.fileContext.path} (${conversation.fileContext.language})\n\n`;
    }
    
    // Add summary if available
    if (conversation.summary) {
      context += `Previous Context Summary:\n${conversation.summary}\n\n`;
    }
    
    // Add recent insights
    if (conversation.insights.length > 0) {
      context += 'Key Insights from Previous Analysis:\n';
      conversation.insights.slice(-5).forEach(insight => {
        context += `- ${insight.title}: ${insight.content}\n`;
      });
      context += '\n';
    }
    
    // Add recent messages
    const recentMessages = conversation.messages.slice(-maxMessages);
    if (recentMessages.length > 0) {
      context += 'Recent Conversation:\n';
      recentMessages.forEach(msg => {
        context += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
      });
    }
    
    return context;
  }
  
  // Search conversations
  searchConversations(query: string): ConversationContext[] {
    const conversations = this.getAllConversations();
    const lowerQuery = query.toLowerCase();
    
    return conversations.filter(conversation => {
      // Search in title
      if (conversation.title.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in file context
      if (conversation.fileContext?.path.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in messages
      if (conversation.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      )) return true;
      
      // Search in insights
      if (conversation.insights.some(insight => 
        insight.title.toLowerCase().includes(lowerQuery) ||
        insight.content.toLowerCase().includes(lowerQuery)
      )) return true;
      
      return false;
    });
  }
  
  // Private methods
  private saveConversation(conversation: ConversationContext): void {
    const conversations = this.getAllConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    // Limit total conversations
    if (conversations.length > this.MAX_CONVERSATIONS) {
      conversations.sort((a, b) => b.updatedAt - a.updatedAt);
      conversations.splice(this.MAX_CONVERSATIONS);
    }
    
    this.saveConversations(conversations);
  }
  
  private saveConversations(conversations: ConversationContext[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
      
      // If storage is full, try to clean up old conversations
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const trimmedConversations = conversations.slice(0, Math.floor(this.MAX_CONVERSATIONS * 0.7));
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedConversations));
        } catch {
          console.error('Failed to save even after cleanup');
        }
      }
    }
  }
  
  private generateSummary(messages: ChatMessage[]): string {
    const userQuestions = messages.filter(m => m.role === 'user').map(m => m.content);
    const aiResponses = messages.filter(m => m.role === 'assistant').map(m => m.content);
    
    if (userQuestions.length === 0) return '';
    
    return `Previous discussion covered: ${userQuestions.slice(0, 3).join(', ')}. Key findings included security analysis and code review insights.`;
  }
  
  private extractInsights(content: string): Insight[] {
    const insights: Insight[] = [];
    
    // Simple pattern matching for common insights
    if (content.includes('vulnerability') || content.includes('security risk')) {
      insights.push({
        type: 'vulnerability',
        title: 'Security Concern Identified',
        content: 'Analysis revealed potential security vulnerabilities',
        confidence: 0.8,
        relatedFiles: [],
        timestamp: Date.now()
      });
    }
    
    if (content.includes('pattern') || content.includes('anti-pattern')) {
      insights.push({
        type: 'pattern',
        title: 'Code Pattern Detected',
        content: 'Identified significant code patterns worth noting',
        confidence: 0.7,
        relatedFiles: [],
        timestamp: Date.now()
      });
    }
    
    if (content.includes('recommend') || content.includes('suggest')) {
      insights.push({
        type: 'suggestion',
        title: 'Improvement Suggestion',
        content: 'AI provided improvement recommendations',
        confidence: 0.75,
        relatedFiles: [],
        timestamp: Date.now()
      });
    }
    
    return insights;
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Export/Import for backup
  exportConversations(): string {
    return JSON.stringify(this.getAllConversations(), null, 2);
  }
  
  importConversations(jsonData: string): boolean {
    try {
      const conversations = JSON.parse(jsonData) as ConversationContext[];
      this.saveConversations(conversations);
      return true;
    } catch (error) {
      console.error('Failed to import conversations:', error);
      return false;
    }
  }
}

export const conversationMemory = new ConversationMemory();