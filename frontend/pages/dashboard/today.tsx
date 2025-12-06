// import { useEffect, useState } from "react";
// import { supabase } from "../../../lib/supabaseClient";

// type Task = {
//   id: string;
//   type: string;
//   status: string;
//   application_id: string;
//   due_at: string;
// };

// export default function TodayDashboard() {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   async function fetchTasks() {
//     setLoading(true);
//     setError(null);

//     try {
//       // TODO:
//       // - Query tasks that are due today and not completed
//       // - Use supabase.from("tasks").select(...)
//       // - You can do date filtering in SQL or client-side

//       // Example:
//       // const { data, error } = await supabase
//       //   .from("tasks")
//       //   .select("*")
//       //   .eq("status", "open");

//       setTasks([]);
//     } catch (err: any) {
//       console.error(err);
//       setError("Failed to load tasks");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function markComplete(id: string) {
//     try {
//       // TODO:
//       // - Update task.status to 'completed'
//       // - Re-fetch tasks or update state optimistically
//     } catch (err: any) {
//       console.error(err);
//       alert("Failed to update task");
//     }
//   }

//   useEffect(() => {
//     fetchTasks();
//   }, []);

//   if (loading) return <div>Loading tasks...</div>;
//   if (error) return <div style={{ color: "red" }}>{error}</div>;

//   return (
//     <main style={{ padding: "1.5rem" }}>
//       <h1>Today&apos;s Tasks</h1>
//       {tasks.length === 0 && <p>No tasks due today 🎉</p>}

//       {tasks.length > 0 && (
//         <table>
//           <thead>
//             <tr>
//               <th>Type</th>
//               <th>Application</th>
//               <th>Due At</th>
//               <th>Status</th>
//               <th>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {tasks.map((t) => (
//               <tr key={t.id}>
//                 <td>{t.type}</td>
//                 <td>{t.application_id}</td>
//                 <td>{new Date(t.due_at).toLocaleString()}</td>
//                 <td>{t.status}</td>
//                 <td>
//                   {t.status !== "completed" && (
//                     <button onClick={() => markComplete(t.id)}>
//                       Mark Complete
//                     </button>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </main>
//   );
// }

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Task = {
  id: string;
  type: string;
  status: string;
  application_id: string;
  due_at: string;
};

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks due TODAY
  async function fetchTasks() {
    setLoading(true);
    setError(null);

    try {
      // Generate today's date boundaries (start & end of day)
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch tasks due today and NOT completed
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .gte("due_at", startOfDay)
        .lte("due_at", endOfDay)
        .neq("status", "completed")
        .order("due_at", { ascending: true });

      if (error) {
        console.error(error);
        setError("Failed to load tasks");
      } else {
        setTasks(data || []);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  // Mark a task as completed
  async function markComplete(id: string) {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) {
        alert("Failed to update task");
        return;
      }

      // Refresh the list after updating
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Failed to update task");
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <main style={{ padding: "1.5rem", fontFamily: "sans-serif" }}>
      <h1>Today's Tasks</h1>

      {tasks.length === 0 && <p>No tasks due today 🎉</p>}

      {tasks.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc" }}>Type</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Application</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Due At</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Status</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.type}</td>
                <td>{t.application_id}</td>
                <td>{new Date(t.due_at).toLocaleString()}</td>
                <td>{t.status}</td>
                <td>
                  {t.status !== "completed" && (
                    <button onClick={() => markComplete(t.id)}>
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

