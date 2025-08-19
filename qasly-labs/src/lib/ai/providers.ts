/**
 * OpenRouter AI Provider
 * Uses OpenRouter API with DeepSeek model
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export class OpenRouterProvider {
  private apiKey = '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';
  private baseURL = 'https://openrouter.ai/api/v1/chat/completions';
  private models = [
    'tngtech/deepseek-r1t2-chimera:free', // Primary model
    'mistralai/mistral-7b-instruct:free', // Fallback 1  
    'meta-llama/llama-3.1-8b-instruct:free', // Fallback 2
    'google/gemma-7b-it:free' // Fallback 3
  ];
  private currentModelIndex = 0;
  
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const maxRetries = this.models.length;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const currentModel = options?.model || this.models[this.currentModelIndex];
      
      try {
        console.log(`Making OpenRouter API request with model: ${currentModel}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Qasly Labs - AI Code Auditor'
          },
          body: JSON.stringify({
            model: currentModel,
            messages,
            temperature: options?.temperature || 0.7,
            max_tokens: options?.maxTokens || 2000 // Reduced for faster response
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenRouter API error with model ${currentModel}: ${response.status} - ${errorText}`);
          
          // If rate limited or model unavailable, try next model
          if (response.status === 429 || response.status === 503 || response.status === 400) {
            this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
            continue;
          }
          
          throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`OpenRouter API response received from model: ${currentModel}`);
        return data.choices?.[0]?.message?.content || 'No response generated';
        
      } catch (error) {
        console.error(`OpenRouter API call failed with model ${currentModel}:`, error);
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`Model ${currentModel} timed out, trying next model...`);
          this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
          continue;
        }
        
        // If it's not a timeout and we have more models to try, continue
        if (attempt < maxRetries - 1) {
          this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
          continue;
        }
        
        throw error;
      }
    }
    
    throw new Error('All models failed to respond');
  }
}

export const aiManager = new OpenRouterProvider();