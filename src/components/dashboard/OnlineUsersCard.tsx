import { Users, Circle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface OnlineUser {
  id: string;
  username: string;
  lastSeen: Date;
  isOnline: boolean;
}

export function OnlineUsersCard() {
  const { data: allUsers = [] } = useUsers();
  const { user: currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    // Simulate online users - in real app this would come from presence/realtime
    const users: OnlineUser[] = allUsers.map((u) => ({
      id: u.id,
      username: u.username || 'مستخدم',
      lastSeen: new Date(Date.now() - Math.random() * 1000 * 60 * 30), // Random time in last 30 mins
      isOnline: u.user_id === currentUser?.id || Math.random() > 0.5, // Current user always online
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
    <Card className="hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            المستخدمون
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Circle className="w-2 h-2 fill-current text-green-500" />
            {activeUsers.length} متصل
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[180px] pr-2">
          <div className="space-y-3">
            {/* Online Users */}
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-success/5 border border-success/20"
              >
                <div className="relative">
                  <Avatar className="h-9 w-9 border-2 border-success/30">
                    <AvatarFallback className="bg-gradient-to-br from-success to-primary text-primary-foreground text-xs">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.username}
                    {currentUser?.id && onlineUsers.find(u => u.id === user.id)?.isOnline && (
                      <span className="text-xs text-muted-foreground mr-1">(أنت)</span>
                    )}
                  </p>
                  <p className="text-xs text-success">متصل الآن</p>
                </div>
              </div>
            ))}

            {/* Offline Users */}
            {offlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="relative">
                  <Avatar className="h-9 w-9 opacity-60">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-muted-foreground/50 rounded-full border-2 border-background" />
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
      </CardContent>
    </Card>
  );
}
