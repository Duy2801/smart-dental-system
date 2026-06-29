import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import Config from 'react-native-config';
interface socketProviderProps {
  children: ReactNode;
  token: string | null;
}
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children, token }: socketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const socketInstance = io(Config.BACKEND_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketInstance.on('connect', () => {
      console.log('Socket connected with ID:', socketInstance.id);
      setIsConnected(true);
    });
    socketInstance.on('disconnect', reason => {
      console.log('Socket disconnected. Reason:', reason);
      setIsConnected(false);
    });
    socketInstance.on('connect_error', err => {
      console.log('Connect Error:', err.message);
    });
    setSocket(socketInstance);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [token]);

  const value = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
