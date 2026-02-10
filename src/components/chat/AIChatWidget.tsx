import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Maximize2, Minimize2, Sparkles, TrendingUp, Package, Users, DollarSign, BarChart3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useCompany } from '@/contexts/CompanyContext';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const smartQuestions = [
  { icon: TrendingUp, label: 'أرباح هذا الشهر', query: 'كم إجمالي الأرباح هذا الشهر؟ وما هي نسبة التغير مقارنة بالشهر السابق؟' },
  { icon: DollarSign, label: 'ملخص المبيعات', query: 'أعطني ملخص شامل عن المبيعات هذا الشهر مع أعلى 3 صفقات' },
  { icon: Package, label: 'حالة المخزون', query: 'كم عدد السيارات المتاحة حالياً؟ وما هو متوسط مدة البقاء في المخزون؟' },
  { icon: Users, label: 'أفضل العملاء', query: 'من هم أفضل 5 عملاء من حيث إجمالي المشتريات؟' },
  { icon: BarChart3, label: 'تحليل الأداء', query: 'حلل أداء الشركة المالي هذا الشهر وقدم توصيات للتحسين' },
  { icon: Sparkles, label: 'مقارنة شهرية', query: 'قارن بين أداء هذا الشهر والشهر السابق من حيث المبيعات والأرباح والمشتريات' },
];

export function AIChatWidget() {
  const { companyId } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    const userMsg: Message = { role: 'user', content: msgText };
    if (!text) setInput('');
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg], companyId }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل الاتصال');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const snap = assistantSoFar;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snap } : m);
                }
                return [...prev, { role: 'assistant', content: snap }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${e.message || 'حدث خطأ، حاول مرة أخرى.'}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, companyId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const windowClasses = useMemo(() => {
    if (isFullscreen) {
      return 'fixed inset-0 z-50';
    }
    return 'fixed bottom-24 md:bottom-6 left-4 z-50 w-[360px] sm:w-[400px] h-[540px]';
  }, [isFullscreen]);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 md:bottom-6 left-4 z-50 group"
          aria-label="فتح المساعد الذكي"
        >
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/25">
            <MessageCircle className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-30" />
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-border">
            المساعد الذكي 🤖
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          windowClasses,
          'bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden',
          'animate-scale-in',
          !isFullscreen && 'rounded-2xl',
          isFullscreen && 'rounded-none'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">المساعد الذكي</h3>
                <p className="text-[10px] opacity-80">متصل ببيانات شركتك</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="hover:bg-primary-foreground/15 rounded-lg p-1.5 transition-colors"
                  title="مسح المحادثة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hover:bg-primary-foreground/15 rounded-lg p-1.5 transition-colors"
                title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
                className="hover:bg-primary-foreground/15 rounded-lg p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" dir="rtl">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
                {/* Welcome */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-foreground">مرحباً! أنا مساعدك الذكي</h4>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    لدي وصول مباشر لبيانات شركتك. اسألني عن المبيعات، الأرباح، المخزون، أو أي شيء آخر!
                  </p>
                </div>

                {/* Smart Questions Grid */}
                <div className={cn(
                  "w-full grid gap-2 mt-2",
                  isFullscreen ? "grid-cols-3 max-w-2xl mx-auto" : "grid-cols-2"
                )}>
                  {smartQuestions.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => sendMessage(q.query)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-accent border border-border/50 hover:border-primary/30 transition-all duration-200 text-right group hover:shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <q.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-2.5 animate-fade-in',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground'
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-md'
                    : 'bg-muted/60 border border-border/50 rounded-tl-md text-foreground'
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0 [&>p]:leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="bg-muted/60 border border-border/50 px-4 py-3 rounded-2xl rounded-tl-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions when chatting */}
          {messages.length > 0 && !isLoading && (
            <div className="px-3 py-1.5 border-t border-border/50 shrink-0 overflow-x-auto" dir="rtl">
              <div className="flex gap-1.5 pb-1">
                {smartQuestions.slice(0, 4).map((q) => (
                  <button
                    key={q.label}
                    onClick={() => sendMessage(q.query)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 hover:bg-accent border border-border/50 text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                  >
                    <q.icon className="w-3 h-3" />
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0 bg-background/80 backdrop-blur-sm" dir="rtl">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا..."
                rows={1}
                className="flex-1 resize-none bg-muted/50 border border-border/50 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 max-h-24 transition-all placeholder:text-muted-foreground/60"
              />
              <Button
                size="icon"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
