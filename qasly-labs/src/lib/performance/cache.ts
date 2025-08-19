/**
 * Free Performance Cache System
 * Uses IndexedDB for persistent caching and memory optimization
 */

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  size: number; // Rough data size for cleanup
}

export interface AnalysisCache {
  fileHash: string;
  filePath: string;
  analysis: string;
  findings: any[];
  reasoning: any[];
  timestamp: number;
}

class PerformanceCache {
  private dbName = 'qasly_cache';
  private version = 1;
  private db: IDBDatabase | null = null;
  
  // Memory cache for frequently accessed items
  private memoryCache = new Map<string, CacheEntry>();
  private readonly MAX_MEMORY_SIZE = 10 * 1024 * 1024; // 10MB
  private currentMemorySize = 0;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('analyses')) {
          const analysisStore = db.createObjectStore('analyses', { keyPath: 'fileHash' });
          analysisStore.createIndex('filePath', 'filePath', { unique: false });
          analysisStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('responses')) {
          const responseStore = db.createObjectStore('responses', { keyPath: 'key' });
          responseStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
          convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }
  
  // Cache AI responses
  async cacheResponse(
    prompt: string, 
    response: string, 
    provider: string,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<void> {
    const key = this.generateKey(prompt + provider);
    const entry: CacheEntry = {
      key,
      data: { response, provider },
      timestamp: Date.now(),
      ttl,
      size: this.estimateSize(response)
    };
    
    // Store in memory cache
    this.addToMemoryCache(key, entry);
    
    // Store in IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['responses'], 'readwrite');
      const store = transaction.objectStore('responses');
      store.put(entry);
    }
  }
  
  // Get cached response
  async getCachedResponse(prompt: string, provider: string): Promise<string | null> {
    const key = this.generateKey(prompt + provider);
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      return memoryEntry.data.response;
    }
    
    // Check IndexedDB
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(['responses'], 'readonly');
        const store = transaction.objectStore('responses');
        const request = store.get(key);
        
        request.onsuccess = () => {
          const entry = request.result as CacheEntry;
          if (entry && this.isValidEntry(entry)) {
            // Add back to memory cache
            this.addToMemoryCache(key, entry);
            resolve(entry.data.response);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => resolve(null);
      });
    }
    
    return null;
  }
  
  // Cache file analysis
  async cacheAnalysis(analysis: AnalysisCache): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['analyses'], 'readwrite');
    const store = transaction.objectStore('analyses');
    store.put(analysis);
  }
  
  // Get cached analysis
  async getCachedAnalysis(fileHash: string): Promise<AnalysisCache | null> {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['analyses'], 'readonly');
      const store = transaction.objectStore('analyses');
      const request = store.get(fileHash);
      
      request.onsuccess = () => {
        const analysis = request.result as AnalysisCache;
        if (analysis) {
          // Check if analysis is still fresh (24 hours)
          const age = Date.now() - analysis.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            resolve(analysis);
            return;
          }
        }
        resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  }
  
  // Clean expired entries
  async cleanup(): Promise<void> {
    if (!this.db) return;
    
    const now = Date.now();
    const stores = ['responses', 'analyses'];
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore('responses');
      const index = store.index('timestamp');
      
      // Get all entries older than 7 days
      const range = IDBKeyRange.upperBound(now - 7 * 24 * 60 * 60 * 1000);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
    
    // Clean memory cache
    this.cleanMemoryCache();
  }
  
  // Generate cache key
  private generateKey(input: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  // Check if cache entry is valid
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }
  
  // Memory cache management
  private addToMemoryCache(key: string, entry: CacheEntry): void {
    // Remove if already exists
    if (this.memoryCache.has(key)) {
      const existingEntry = this.memoryCache.get(key)!;
      this.currentMemorySize -= existingEntry.size;
    }
    
    // Check if we need to free space
    while (this.currentMemorySize + entry.size > this.MAX_MEMORY_SIZE) {
      this.evictOldestMemoryEntry();
    }
    
    this.memoryCache.set(key, entry);
    this.currentMemorySize += entry.size;
  }
  
  private evictOldestMemoryEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const entry = this.memoryCache.get(oldestKey)!;
      this.memoryCache.delete(oldestKey);
      this.currentMemorySize -= entry.size;
    }
  }
  
  private cleanMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.memoryCache.delete(key);
        this.currentMemorySize -= entry.size;
      }
    }
  }
  
  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }
  
  // Get cache stats
  getStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      memoryUsage: this.currentMemorySize,
      memoryUsageFormatted: `${(this.currentMemorySize / 1024 / 1024).toFixed(2)} MB`
    };
  }
  
  // Clear all cache
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    
    if (this.db) {
      const stores = ['responses', 'analyses', 'conversations'];
      for (const storeName of stores) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.clear();
      }
    }
  }
}

// Request debouncing for API calls
export class RequestDebouncer {
  private pending = new Map<string, Promise<any>>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  
  async debounce<T>(
    key: string,
    fn: () => Promise<T>,
    delay: number = 300
  ): Promise<T> {
    // Clear existing timeout
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Return existing promise if still pending
    const existingPromise = this.pending.get(key);
    if (existingPromise) {
      return existingPromise;
    }
    
    // Create new debounced promise
    const promise = new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(async () => {
        this.timeouts.delete(key);
        this.pending.delete(key);
        
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
      
      this.timeouts.set(key, timeout);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
}

// Image/Asset lazy loading
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private loaded = new Set<string>();
  
  init() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            this.loadElement(element);
            this.observer?.unobserve(element);
          }
        });
      },
      { rootMargin: '50px' }
    );
  }
  
  observe(element: HTMLElement) {
    if (!this.observer) return;
    this.observer.observe(element);
  }
  
  private loadElement(element: HTMLElement) {
    const src = element.dataset.src;
    const id = element.dataset.id;
    
    if (src && id && !this.loaded.has(id)) {
      if (element.tagName === 'IMG') {
        (element as HTMLImageElement).src = src;
      }
      this.loaded.add(id);
    }
  }
}

// Initialize cache
export const performanceCache = new PerformanceCache();
export const requestDebouncer = new RequestDebouncer();
export const lazyLoader = new LazyLoader();

// Auto-initialize
if (typeof window !== 'undefined') {
  performanceCache.init().catch(console.error);
  lazyLoader.init();
  
  // Cleanup every hour
  setInterval(() => {
    performanceCache.cleanup().catch(console.error);
  }, 60 * 60 * 1000);
}