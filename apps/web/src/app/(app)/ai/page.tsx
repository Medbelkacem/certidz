"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { cn } from "@/lib/utils";
import {
  type ChatMessage,
  documents,
  sampleConversation,
  suggestedPrompts
} from "@/lib/mock-data";

const ASSISTANT_REPLY =
  "Thanks — I'm reviewing that against the selected document now.\n\n" +
  "• I'll extract the key obligations, deadlines and any non-standard clauses.\n" +
  "• Anything that diverges from your templates will be flagged with the article number.\n\n" +
  "This is a demo assistant, so the analysis above is illustrative.";

const contextDocuments = documents.slice(0, 5);

export default function AiAssistantPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>(sampleConversation);
  const [input, setInput] = React.useState("");
  const idRef = React.useRef(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const nextId = React.useCallback((role: string) => {
    idRef.current += 1;
    return `local_${role}_${idRef.current}`;
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = React.useCallback(
    (raw: string) => {
      const content = raw.trim();
      if (!content) return;
      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: nextId("user"),
        role: "user",
        content,
        at: now
      };
      const assistantMessage: ChatMessage = {
        id: nextId("assistant"),
        role: "assistant",
        content: ASSISTANT_REPLY,
        at: now
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
    },
    [nextId]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="Summarize contracts, surface risky clauses and answer questions about any document in your workspace."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Chat panel */}
        <Card className="order-2 flex h-[calc(100dvh-13rem)] min-h-[520px] flex-col overflow-hidden lg:order-1">
          <div
            ref={scrollRef}
            className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4"
          >
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser ? (
                    <span
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    >
                      AI
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="ai-composer" className="sr-only">
                Message the assistant
              </Label>
              <Input
                id="ai-composer"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a contract, clause or deadline…"
                autoComplete="off"
              />
              <Button
                type="submit"
                variant="gold"
                size="icon"
                aria-label="Send message"
                disabled={input.trim().length === 0}
              >
                <Send aria-hidden="true" />
              </Button>
            </div>
          </form>
        </Card>

        {/* Context sidebar */}
        <div className="order-1 space-y-4 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="ai-document" className="text-xs text-muted-foreground">
                Analyse against
              </Label>
              <select
                id="ai-document"
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                defaultValue={contextDocuments[0]?.name}
              >
                {contextDocuments.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles
                  className="size-4 text-gold-600 dark:text-gold-300"
                  aria-hidden="true"
                />
                Suggested prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    aria-label={`Use prompt: ${prompt}`}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-transparent hover:bg-emerald-500/10 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:text-emerald-400"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
