import { useEffect, useCallback, useRef, useState } from "react";
import { RoomEvent, DataPacket_Kind } from "livekit-client";

export type GameMessage =
  | { type: 'GAME_INVITE'; gameId: string; category: string; betAmount: number }
  | { type: 'INVITE_ACCEPTED'; gameId: string }
  | { type: 'INVITE_DECLINED'; gameId: string }
  | { type: 'QUIZ_SYNC_QUESTIONS'; questions: any[] }
  | { type: 'QUIZ_ANSWER'; index: number; isCorrect: boolean; timeTaken: number }
  | { type: 'GAME_MOVE'; game: string; data: any };

/**
 * Hook to sync game state between two users via LiveKit Data Channels.
 * Supports typed game messages for the handshake protocol + quiz sync.
 */
export function useGameSync(room: any | null) {
  const [lastMessage, setLastMessage] = useState<GameMessage | null>(null);
  const encoderRef = useRef(new TextEncoder());
  const decoderRef = useRef(new TextDecoder());
  const listenersRef = useRef<Map<string, (msg: GameMessage) => void>>(new Map());

  const sendMessage = useCallback((msg: GameMessage) => {
    if (!room?.localParticipant) return;
    const payload = encoderRef.current.encode(JSON.stringify(msg));
    room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
  }, [room]);

  /** Register a handler for a specific message type */
  const onMessage = useCallback((type: string, handler: (msg: GameMessage) => void) => {
    listenersRef.current.set(type, handler);
    return () => { listenersRef.current.delete(type); };
  }, []);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      if (participant?.isLocal) return;
      try {
        const msg = JSON.parse(decoderRef.current.decode(payload)) as GameMessage;
        setLastMessage(msg);
        // Call registered listener
        const handler = listenersRef.current.get(msg.type);
        if (handler) handler(msg);
      } catch {
        // ignore non-JSON messages
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return { sendMessage, lastMessage, onMessage };
}
