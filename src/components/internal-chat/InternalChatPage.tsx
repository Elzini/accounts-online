import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessagesSquare, Send, Hash, Users, Plus, Search, Paperclip, Smile, Bell } from 'lucide-react';

export function InternalChatPage() {
  const [message, setMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');

  const channels = [
    { id: 'general', name: 'عام', unread: 0, members: 45 },
    { id: 'sales', name: 'المبيعات', unread: 3, members: 12 },
    { id: 'support', name: 'الدعم الفني', unread: 1, members: 8 },
    { id: 'hr', name: 'الموارد البشرية', unread: 0, members: 5 },
    { id: 'announcements', name: 'الإعلانات', unread: 2, members: 45 },
  ];

  const messages = [
    { id: 1, user: 'أحمد محمد', avatar: 'أم', time: '10:30', text: 'صباح الخير جميعاً 👋', channel: 'general' },
    { id: 2, user: 'سارة علي', avatar: 'سع', time: '10:32', text: 'صباح النور! هل تم تحديث التقرير الشهري؟', channel: 'general' },
    { id: 3, user: 'خالد سعد', avatar: 'خس', time: '10:35', text: 'نعم، تم رفعه على المجلد المشترك', channel: 'general' },
    { id: 4, user: 'نورة فهد', avatar: 'نف', time: '10:40', text: 'تذكير: اجتماع الفريق الساعة 2 ظهراً في قاعة المؤتمرات', channel: 'general' },
    { id: 5, user: 'محمد عبدالله', avatar: 'مع', time: '11:00', text: 'تم إغلاق صفقة جديدة بقيمة 50,000 ريال 🎉', channel: 'general' },
  ];

  const directMessages = [
    { id: 1, user: 'خالد سعد', avatar: 'خس', lastMessage: 'تم إرسال الملف', time: '11:15', unread: 1, online: true },
    { id: 2, user: 'سارة علي', avatar: 'سع', lastMessage: 'شكراً لك', time: '10:45', unread: 0, online: true },
    { id: 3, user: 'فهد أحمد', avatar: 'فأ', lastMessage: 'متى الاجتماع؟', time: '09:30', unread: 0, online: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <MessagesSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">المحادثات الداخلية</h1>
            <p className="text-sm text-muted-foreground">دردشة فورية بين أعضاء الفريق</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-3 space-y-4">
            <Input placeholder="بحث..." className="h-8" />
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground">القنوات</span>
                <Button variant="ghost" size="icon" className="h-5 w-5"><Plus className="w-3 h-3" /></Button>
              </div>
              {channels.map(ch => (
                <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-muted ${activeChannel === ch.id ? 'bg-muted font-medium' : ''}`}>
                  <span className="flex items-center gap-1.5"><Hash className="w-3 h-3 text-muted-foreground" />{ch.name}</span>
                  {ch.unread > 0 && <Badge variant="destructive" className="h-5 min-w-5 text-[10px]">{ch.unread}</Badge>}
                </button>
              ))}
            </div>

            <div>
              <span className="text-xs font-bold text-muted-foreground">رسائل مباشرة</span>
              {directMessages.map(dm => (
                <button key={dm.id} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">{dm.avatar}</div>
                    {dm.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs font-medium">{dm.user}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{dm.lastMessage}</p>
                  </div>
                  {dm.unread > 0 && <Badge variant="destructive" className="h-4 min-w-4 text-[10px]">{dm.unread}</Badge>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="w-4 h-4" />
              {channels.find(c => c.id === activeChannel)?.name}
              <Badge variant="secondary" className="text-xs">{channels.find(c => c.id === activeChannel)?.members} عضو</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(m => (
                  <div key={m.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">{m.avatar}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{m.user}</span>
                        <span className="text-xs text-muted-foreground">{m.time}</span>
                      </div>
                      <p className="text-sm mt-0.5">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-3 flex gap-2">
              <Button variant="ghost" size="icon" className="shrink-0"><Paperclip className="w-4 h-4" /></Button>
              <Input placeholder="اكتب رسالة..." value={message} onChange={e => setMessage(e.target.value)} className="flex-1" />
              <Button variant="ghost" size="icon" className="shrink-0"><Smile className="w-4 h-4" /></Button>
              <Button size="icon" className="shrink-0"><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
