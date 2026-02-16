import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessagesSquare, Send, Hash, Users, Plus, Paperclip, Smile } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useChatChannels, useAddChatChannel, useChatMessages, useAddChatMessage } from '@/hooks/useModuleData';

export function InternalChatPage() {
  const [message, setMessage] = useState('');
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [senderName, setSenderName] = useState('مستخدم');

  const { data: channels = [] } = useChatChannels();
  const { data: messages = [], refetch: refetchMessages } = useChatMessages(activeChannelId);
  const addChannel = useAddChatChannel();
  const addMessage = useAddChatMessage();

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) setActiveChannelId(channels[0].id);
  }, [channels, activeChannelId]);

  // Realtime subscription
  useEffect(() => {
    if (!activeChannelId) return;
    const channel = supabase.channel('chat-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${activeChannelId}` }, () => refetchMessages()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChannelId, refetchMessages]);

  const handleSend = () => {
    if (!message.trim() || !activeChannelId) return;
    addMessage.mutate({ channel_id: activeChannelId, sender_name: senderName, content: message });
    setMessage('');
  };

  const activeChannel = channels.find((c: any) => c.id === activeChannelId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><MessagesSquare className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">المحادثات الداخلية</h1><p className="text-sm text-muted-foreground">دردشة فورية بين أعضاء الفريق</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="اسمك" value={senderName} onChange={e => setSenderName(e.target.value)} className="w-32 h-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
        <Card className="lg:col-span-1">
          <CardContent className="p-3 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">القنوات</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowAddChannel(true)}><Plus className="w-3 h-3" /></Button>
            </div>
            {channels.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">لا توجد قنوات. أنشئ واحدة.</p> :
            channels.map((ch: any) => (
              <button key={ch.id} onClick={() => setActiveChannelId(ch.id)} className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm hover:bg-muted ${activeChannelId === ch.id ? 'bg-muted font-medium' : ''}`}>
                <Hash className="w-3 h-3 text-muted-foreground" />{ch.name}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="w-4 h-4" />{activeChannel?.name || 'اختر قناة'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد رسائل بعد.</p>}
                {messages.map((m: any) => (
                  <div key={m.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">{m.sender_name?.slice(0, 2)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{m.sender_name}</span>
                        <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm mt-0.5">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-3 flex gap-2">
              <Input placeholder="اكتب رسالة..." value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1" disabled={!activeChannelId} />
              <Button size="icon" onClick={handleSend} disabled={!activeChannelId || !message.trim()}><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddChannel} onOpenChange={setShowAddChannel}>
        <DialogContent><DialogHeader><DialogTitle>إنشاء قناة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم القناة *</Label><Input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} /></div>
            <Button onClick={() => { if (!newChannelName) return; addChannel.mutate({ name: newChannelName }, { onSuccess: () => { setShowAddChannel(false); setNewChannelName(''); } }); }} disabled={addChannel.isPending} className="w-full">{addChannel.isPending ? 'جاري...' : 'إنشاء القناة'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
