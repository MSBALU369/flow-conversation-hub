import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface CallState {
  isInCall: boolean;
  isConnected: boolean;
  partnerName: string | null;
  partnerAvatar: string | null;
  callSeconds: number;
}

interface IncomingCall {
  active: boolean;
  callerName: string | null;
  callerAvatar: string | null;
}

interface CallStateContextType {
  callState: CallState;
  incomingCall: IncomingCall;
  startCall: (partnerName: string | null, partnerAvatar: string | null) => void;
  endCall: () => void;
  updateCallSeconds: (seconds: number) => void;
  triggerIncomingCall: (callerName: string, callerAvatar: string | null) => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
}

const CallStateContext = createContext<CallStateContextType | undefined>(undefined);

export function CallStateProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isConnected: false,
    partnerName: null,
    partnerAvatar: null,
    callSeconds: 0,
  });

  const [incomingCall, setIncomingCall] = useState<IncomingCall>({
    active: false,
    callerName: null,
    callerAvatar: null,
  });

  const startCall = useCallback((partnerName: string | null, partnerAvatar: string | null) => {
    setCallState({ isInCall: true, isConnected: true, partnerName, partnerAvatar, callSeconds: 0 });
  }, []);

  const endCall = useCallback(() => {
    setCallState({ isInCall: false, isConnected: false, partnerName: null, partnerAvatar: null, callSeconds: 0 });
  }, []);

  const updateCallSeconds = useCallback((seconds: number) => {
    setCallState(prev => ({ ...prev, callSeconds: seconds }));
  }, []);

  const triggerIncomingCall = useCallback((callerName: string, callerAvatar: string | null) => {
    setIncomingCall({ active: true, callerName, callerAvatar });
  }, []);

  const acceptIncomingCall = useCallback(() => {
    setIncomingCall(prev => {
      setCallState({ isInCall: true, isConnected: true, partnerName: prev.callerName, partnerAvatar: prev.callerAvatar, callSeconds: 0 });
      return { active: false, callerName: null, callerAvatar: null };
    });
  }, []);

  const declineIncomingCall = useCallback(() => {
    setIncomingCall({ active: false, callerName: null, callerAvatar: null });
  }, []);

  return (
    <CallStateContext.Provider value={{
      callState, incomingCall, startCall, endCall, updateCallSeconds,
      triggerIncomingCall, acceptIncomingCall, declineIncomingCall,
    }}>
      {children}
    </CallStateContext.Provider>
  );
}

export function useCallState() {
  const context = useContext(CallStateContext);
  if (!context) throw new Error("useCallState must be used within CallStateProvider");
  return context;
}
