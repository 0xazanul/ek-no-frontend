import { z } from "zod";

// Common validation schemas
export const FilePathSchema = z.string()
  .min(1, "Path cannot be empty")
  .max(500, "Path too long")
  .regex(/^[^<>:"|?*]+$/, "Path contains invalid characters")
  .refine((path) => !path.includes('..'), "Path traversal not allowed");

export const FileContentSchema = z.string()
  .max(10 * 1024 * 1024, "Content too large") // 10MB limit
  .optional();

export const GitHubUrlSchema = z.string()
  .url("Invalid URL format")
  .max(200, "URL too long")
  .regex(/^https:\/\/github\.com\/[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?\/[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?\/?$/, 
    "Invalid GitHub repository URL format")
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'github.com' && parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, "Only github.com HTTPS URLs are allowed")
  .refine((url) => {
    const suspiciousChars = ['&', '|', ';', '`', '$', '(', ')', '{', '}', '[', ']', '<', '>', '"', "'", '\\', '\n', '\r', '\t'];
    return !suspiciousChars.some(char => url.includes(char));
  }, "URL contains suspicious characters");

// API request schemas
export const FileGetSchema = z.object({
  path: FilePathSchema,
});

export const FilePostSchema = z.object({
  path: FilePathSchema,
  content: FileContentSchema,
});

export const RepoConnectSchema = z.object({
  url: z.union([
    z.string().length(0), // Empty string for sample repo
    GitHubUrlSchema,
  ]).optional(),
});

export const AnalyzeFileSchema = z.object({
  path: FilePathSchema,
  content: z.string().max(10 * 1024 * 1024, "Content too large"),
});

// Chat API schemas
export const ChatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(50000, "Message content too long"),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessage).max(100, "Too many messages"),
  currentFile: FilePathSchema.optional(),
  code: z.string().max(10 * 1024 * 1024, "Code content too large").optional(),
});

// Helper function to validate and parse request bodies
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Invalid request format' };
  }
}
