"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Plus, Search, Calendar, User, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { TaskPriority, TaskStatus } from "@prisma/client";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  disaster: { id: string; name: string };
  assignedVolunteer?: { id: string; name: string; phone: string };
}

export default function TasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [disasters, setDisasters] = useState<Array<{ id: string; name: string }>>([]);
  const [volunteers, setVolunteers] = useState<Array<{ id: string; name: string; skills: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    disasterId: "",
    assignedVolunteerId: "",
    priority: "High",
    dueDate: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    try {
      const [taskRes, disRes, volRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/disasters"),
        fetch("/api/volunteers"),
      ]);

      if (taskRes.ok) {
        const data = await taskRes.json();
        setTasks(data.tasks || []);
      }
      if (disRes.ok) {
        const data = await disRes.json();
        setDisasters(data.disasters || []);
        if (data.disasters?.length > 0 && !form.disasterId) {
          setForm((prev) => ({ ...prev, disasterId: data.disasters[0].id }));
        }
      }
      if (volRes.ok) {
        const data = await volRes.json();
        setVolunteers(data.volunteers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
        showToast("Operational field task created", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create task", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        showToast(`Task status updated to ${newStatus.replace("_", " ")}`, "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const priorityColors: Record<TaskPriority, string> = {
    Critical: "badge-critical",
    High: "badge-high",
    Medium: "badge-warning",
    Low: "badge-success",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span>Disaster Operational Task Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create field assignments, assign response personnel, and track task completion.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Field Task</span>
        </button>
      </div>

      {/* Controls */}
      <div className="saas-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task title..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 w-full sm:w-auto"
        >
          <option value="">All Statuses</option>
          {Object.values(TaskStatus).map((st) => (
            <option key={st} value={st}>{st.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading task board...</div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="saas-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className="text-slate-500">Incident: <span className="font-semibold text-slate-900">{task.disaster.name}</span></span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{task.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  Assigned Personnel:{" "}
                  <span className="font-semibold text-indigo-600">
                    {task.assignedVolunteer ? task.assignedVolunteer.name : "Unassigned"}
                  </span>
                </span>
                {task.dueDate && (
                  <span>Due Date: {new Date(task.dueDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Create Operational Field Task
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Task Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Disaster Incident</label>
                <select
                  value={form.disasterId}
                  onChange={(e) => setForm({ ...form, disasterId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {disasters.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Assign Personnel (Optional)</label>
                <select
                  value={form.assignedVolunteerId}
                  onChange={(e) => setForm({ ...form, assignedVolunteerId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="">-- Unassigned --</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.skills})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
