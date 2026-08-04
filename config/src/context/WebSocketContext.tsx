import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { OnlineUser, OnlineBattleRoom, BattlePlayerState } from '../types';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  incomingChallenge: OnlineBattleRoom | null;
  activeRoom: OnlineBattleRoom | null;
  notificationMessage: string | null;
  clearNotification: () => void;
  sendChallenge: (targetUserId: string) => void;
  respondChallenge: (battleId: string, accept: boolean) => void;
  markReady: (battleId: string) => void;
  updateProgress: (battleId: string, stats: BattlePlayerState) => void;
  leaveBattle: (battleId: string) => void;
  setActiveRoom: React.Dispatch<React.SetStateAction<OnlineBattleRoom | null>>;
  setIncomingChallenge: React.Dispatch<React.SetStateAction<OnlineBattleRoom | null>>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setActiveTab, refreshUserData } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<OnlineBattleRoom | null>(null);
  const [activeRoom, setActiveRoom] = useState<OnlineBattleRoom | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  // Poll HTTP API fallback if WebSocket disconnected
  useEffect(() => {
    if (!user) return;
    const fetchUsersAndNotifs = async () => {
      try {
        const res = await fetch('/api/battle/online-users');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          setOnlineUsers(Array.isArray(data) ? data : []);
        }
        const notifRes = await fetch(`/api/battle/notifications/${user.id}`);
        const notifContentType = notifRes.headers.get('content-type') || '';
        if (notifRes.ok && notifContentType.includes('application/json')) {
          const notifData = await notifRes.json();
          if (notifData.incomingInvite && !incomingChallenge) {
            setIncomingChallenge(notifData.incomingInvite);
          }
          if (notifData.activeRoom) {
            setActiveRoom(notifData.activeRoom);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    fetchUsersAndNotifs();
    const interval = setInterval(fetchUsersAndNotifs, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      socketRef.current = ws;
      setSocket(ws);
      ws.send(JSON.stringify({ type: 'AUTH', userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'ONLINE_USERS_UPDATE') {
          setOnlineUsers(Array.isArray(data.users) ? data.users : []);
        }

        if (data.type === 'INCOMING_CHALLENGE') {
          setIncomingChallenge(data.room);
        }

        if (data.type === 'CHALLENGE_ACCEPTED') {
          setActiveRoom(data.room);
          setIncomingChallenge(null);
          setActiveTab('jang');
        }

        if (data.type === 'CHALLENGE_DECLINED') {
          setNotificationMessage(data.message || "Raqib taklifni rad etdi.");
          setIncomingChallenge(null);
        }

        if (data.type === 'ROOM_UPDATE' || data.type === 'BATTLE_STARTED' || data.type === 'ROOM_PROGRESS') {
          setActiveRoom(data.room);
        }

        if (data.type === 'BATTLE_FINISHED') {
          setActiveRoom(data.room);
          refreshUserData();
        }

        if (data.type === 'OPPONENT_DISCONNECTED') {
          setNotificationMessage(data.message || "Opponent disconnected.");
          refreshUserData();
        }
      } catch (err) {
        console.error("WS client message parse error:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [user?.id]);

  const clearNotification = () => setNotificationMessage(null);

  const sendChallenge = (targetUserId: string) => {
    if (!user) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'SEND_CHALLENGE',
        inviterId: user.id,
        inviteeId: targetUserId
      }));
    } else {
      // HTTP Fallback
      fetch('/api/battle/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviterId: user.id, inviteeId: targetUserId })
      }).then(res => res.json()).then(data => {
        if (data.room) setActiveRoom(data.room);
      });
    }
  };

  const respondChallenge = (battleId: string, accept: boolean) => {
    if (!user) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'RESPOND_CHALLENGE',
        battleId,
        userId: user.id,
        action: accept ? 'accept' : 'decline'
      }));
    } else {
      fetch('/api/battle/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, userId: user.id, action: accept ? 'accept' : 'decline' })
      });
    }
    setIncomingChallenge(null);
    if (accept) {
      setActiveTab('jang');
    }
  };

  const markReady = (battleId: string) => {
    if (!user) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'PLAYER_READY',
        battleId,
        userId: user.id
      }));
    } else {
      fetch('/api/battle/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, userId: user.id })
      });
    }
  };

  const updateProgress = (battleId: string, stats: BattlePlayerState) => {
    if (!user) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'PROGRESS_UPDATE',
        battleId,
        userId: user.id,
        ...stats
      }));
    } else {
      fetch('/api/battle/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, userId: user.id, ...stats })
      });
    }
  };

  const leaveBattle = (battleId: string) => {
    if (!user) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'LEAVE_BATTLE',
        battleId,
        userId: user.id
      }));
    } else {
      fetch('/api/battle/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, userId: user.id })
      });
    }
    setActiveRoom(null);
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        incomingChallenge,
        activeRoom,
        notificationMessage,
        clearNotification,
        sendChallenge,
        respondChallenge,
        markReady,
        updateProgress,
        leaveBattle,
        setActiveRoom,
        setIncomingChallenge
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
