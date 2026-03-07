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
 * 
 * New API: sendMessage/lastMessage/onMessage for typed protocol messages.
 * Legacy API: sendMove/lastReceivedMove for backward compat with existing games.
 */
export function useGameSync<T = any>(room: any | null, gameId?: string) {
  const [lastMessage, setLastMessage] = useState<GameMessage | null>(null);
  const [lastReceivedMove, setLastReceivedMove] = useState<T | null>(null);
  const encoderRef = useRef(new TextEncoder());
  const decoderRef = useRef(new TextDecoder());
  const listenersRef = useRef<Map<string, (msg: GameMessage) => void>>(new Map());

  /** New: send a typed protocol message */
  const sendMessage = useCallback((msg: GameMessage) => {
    if (!room?.localParticipant) return;
    const payload = encoderRef.current.encode(JSON.stringify(msg));
    room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
  }, [room]);

  /** Legacy: send a game move (wraps as GAME_MOVE) */
  const sendMove = useCallback((data: T) => {
    if (!room?.localParticipant) return;
    const payload = encoderRef.current.encode(
      JSON.stringify({ type: 'GAME_MOVE', game: gameId || '', data })
    );
    room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
  }, [room, gameId]);

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
        const raw = JSON.parse(decoderRef.current.decode(payload));
        
        // Handle typed messages
        if (raw.type) {
          setLastMessage(raw as GameMessage);
          const handler = listenersRef.current.get(raw.type);
          if (handler) handler(raw as GameMessage);
        }
        
        // Legacy: handle GAME_MOVE or old-format { game, data } messages
        if (raw.type === 'GAME_MOVE' && raw.game === gameId) {
          setLastReceivedMove(raw.data);
        } else if (!raw.type && raw.game === gameId) {
          // Old format backward compat
          setLastReceivedMove(raw.data);
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, gameId]);

  return { sendMessage, lastMessage, onMessage, sendMove, lastReceivedMove };
}
