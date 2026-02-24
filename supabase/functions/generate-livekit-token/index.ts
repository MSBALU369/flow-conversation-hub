import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken } from "npm:livekit-server-sdk@2.6.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { room_id, participant_name } = await req.json();
    console.log("[generate-livekit-token] Request:", { room_id, participant_name });

    if (!room_id || !participant_name) {
      console.error("[generate-livekit-token] Missing params:", { room_id, participant_name });
      return new Response(
        JSON.stringify({ error: "room_id and participant_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");

    if (!apiKey || !apiSecret) {
      console.error("[generate-livekit-token] LIVEKIT_API_KEY or LIVEKIT_API_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "LiveKit credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participant_name,
      name: participant_name,
      ttl: "10m",
    });

    at.addGrant({
      roomJoin: true,
      room: room_id,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    console.log("[generate-livekit-token] Token generated for room:", room_id, "participant:", participant_name);

    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-livekit-token error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
