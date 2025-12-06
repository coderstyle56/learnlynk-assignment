// LearnLynk Tech Test - Task 3: Edge Function create-task
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

// Allowed task types
const VALID_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<CreateTaskPayload>;
    const { application_id, task_type, due_at } = body;

    // --------------------------
    // VALIDATION
    ---------------------------
    if (!application_id || !task_type || !due_at) {
      return new Response(
        JSON.stringify({ error: "Missing fields: application_id, task_type, due_at required." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate task type
    if (!VALID_TYPES.includes(task_type)) {
      return new Response(JSON.stringify({ error: "Invalid task_type." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate due_at timestamp
    const dueDate = new Date(due_at);
    if (isNaN(dueDate.getTime()) || dueDate <= new Date()) {
      return new Response(JSON.stringify({ error: "due_at must be a valid future date." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --------------------------
    // INSERT TASK INTO DATABASE
    // ---------------------------
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        application_id,
        type: task_type,
        due_at,
        status: "open",
        tenant_id: "00000000-0000-0000-0000-000000000000", // normally determined from auth context
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insert Error:", error);
      return new Response(JSON.stringify({ error: "Failed to create task." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const task_id = data.id;

    // --------------------------
    // EMIT REALTIME EVENT
    // --------------------------
    await supabase.realtime.broadcast("task.created", {
      task_id,
      application_id,
      task_type,
    });

    // --------------------------
    // SUCCESS RESPONSE
    // --------------------------
    return new Response(JSON.stringify({ success: true, task_id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unexpected Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
