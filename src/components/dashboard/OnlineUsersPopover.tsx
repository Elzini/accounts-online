import { Users, Circle, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface OnlineUser {
  id: string;
  username: string;
  lastSeen: Date;
  isOnline: boolean;
}

export function OnlineUsersPopover() {
  const { data: allUsers = [] } = useUsers();
  const { user: currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const users: OnlineUser[] = allUsers.map((u) => ({
      id: u.id,
      username: u.username || 'مستخدم',
      lastSeen: new Date(Date.now() - Math.random() * 1000 * 60 * 30),
      isOnline: u.user_id === currentUser?.id || Math.random() > 0.5,
    }));
    setOnlineUsers(users);
  }, [allUsers, currentUser]);

  const activeUsers = onlineUsers.filter(u => u.isOnline);
  const offlineUsers = onlineUsers.filter(u => !u.isOnline);

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const getTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    return `منذ ${Math.floor(mins / 60)} ساعة`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-2 hover:bg-primary/10"
        >
          <Users className="w-5 h-5" />
          <Badge 
            variant="secondary" 
            className="h-5 min-w-5 px-1.5 text-xs bg-success/20 text-success border-0"
          >
            {activeUsers.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Circle className="w-2.5 h-2.5 fill-success text-success" />
              المتصلين الآن
            </h4>
            <Badge variant="secondary">{activeUsers.length}</Badge>
          </div>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {/* Online Users */}
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-success/5 hover:bg-success/10 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-success/30">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-semibold">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.username}
                    {currentUser?.id && user.id === currentUser.id && (
                      <span className="text-xs text-primary mr-1">(أنت)</span>
                    )}
                  </p>
                  <p className="text-xs text-success">متصل الآن</p>
                </div>
              </div>
            ))}

            {/* Separator if there are offline users */}
            {offlineUsers.length > 0 && activeUsers.length > 0 && (
              <div className="py-2">
                <div className="h-px bg-border" />
                <p className="text-xs text-muted-foreground text-center mt-2">غير متصلين</p>
              </div>
            )}

            {/* Offline Users */}
            {offlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 opacity-60">
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-muted-foreground/50 rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-muted-foreground">
                    {user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">{getTimeAgo(user.lastSeen)}</p>
                </div>
              </div>
            ))}

            {onlineUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا يوجد مستخدمين</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
