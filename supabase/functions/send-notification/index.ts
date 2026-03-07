import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import admin from "npm:firebase-admin@13.0.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Initialize Firebase Admin once (cached across invocations)
function getFirebaseApp() {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT secret is not configured");

  const serviceAccount = JSON.parse(serviceAccountJson);
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { target_user_id, title, body, type } = await req.json();

    if (!target_user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "target_user_id, title, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch FCM token for target user
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("id", target_user_id)
      .single();

    if (profileErr || !profile?.fcm_token) {
      console.log("[send-notification] No FCM token for user:", target_user_id);
      return new Response(
        JSON.stringify({ success: false, reason: "no_token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Firebase
    getFirebaseApp();

    // Build the message
    const message: admin.messaging.Message = {
      token: profile.fcm_token,
      notification: { title, body },
      data: { type: type || "general", target_user_id },
    };

    // For call notifications, set high priority to wake the device
    if (type === "call") {
      message.android = {
        priority: "high" as const,
        notification: {
          channelId: "calls",
          priority: "max" as const,
          sound: "default",
        },
      };
      message.apns = {
        headers: { "apns-priority": "10" },
        payload: { aps: { sound: "default", contentAvailable: true } },
      };
    }

    const messageId = await admin.messaging().send(message);
    console.log("[send-notification] Sent successfully, messageId:", messageId);

    return new Response(
      JSON.stringify({ success: true, messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[send-notification] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
