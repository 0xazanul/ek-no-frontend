import * as React from "react";
import { ChatPanel } from "@/components/chat/chat-panel";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function SingleChat({ activePath, code }: { activePath?: string; code?: string }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSend(content: string) {
    const userMsg: Message = { id: Date.now() + "", role: "user", content };
    setMessages((msgs) => [...msgs, userMsg, { id: Date.now() + 1 + "", role: "assistant", content: "" }]);
    setIsLoading(true);
    try {
      const body: any = {
        messages: [...messages, userMsg],
        currentFile: activePath,
      };
      if (activePath && code) {
        body.code = code;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.role === "assistant" && msg.content === "" ? { ...msg, content: data.reply || "[No response]" } : msg
        )
      );
    } catch (e) {
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.role === "assistant" && msg.content === "" ? { ...msg, content: "[AI error: failed to get response]" } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full w-full flex flex-col">
      <ChatPanel
        messages={messages}
        onSend={handleSend}
      />
    </div>
  );
}
