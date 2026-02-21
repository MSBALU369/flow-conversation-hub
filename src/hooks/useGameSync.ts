import { useEffect, useCallback, useRef, useState } from "react";
import { RoomEvent, DataPacket_Kind } from "livekit-client";

/**
 * Hook to sync game state between two users via LiveKit Data Channels.
 * 
 * Usage:
 *   const { sendMove, lastReceivedMove } = useGameSync(room, "chess");
 *   sendMove({ type: "move", from: [0,0], to: [1,1] });
 *   // lastReceivedMove updates when the other user sends a move
 */
export function useGameSync<T = any>(room: any | null, gameId: string) {
  const [lastReceivedMove, setLastReceivedMove] = useState<T | null>(null);
  const encoderRef = useRef(new TextEncoder());
  const decoderRef = useRef(new TextDecoder());

  const sendMove = useCallback((data: T) => {
    if (!room?.localParticipant) return;
    const payload = encoderRef.current.encode(
      JSON.stringify({ game: gameId, data })
    );
    room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
  }, [room, gameId]);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      if (participant?.isLocal) return;
      try {
        const msg = JSON.parse(decoderRef.current.decode(payload));
        if (msg.game === gameId) {
          setLastReceivedMove(msg.data);
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

  return { sendMove, lastReceivedMove };
}
