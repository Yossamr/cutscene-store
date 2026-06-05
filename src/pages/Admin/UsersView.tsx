import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Loader2, UserX, UserCheck } from "lucide-react";

export function UsersView() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await apiFetch(`/api/admin/users/${id}/toggle`, { 
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User status updated");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user status");
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Users Management</h2>
      <div className="bg-white p-4 rounded-xl border">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Points</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.phone}</td>
                <td>{user.role}</td>
                <td>{user.points || 0}</td>
                <td>{user.is_active ? "Active" : "Blocked"}</td>
                <td>
                  <button onClick={() => toggleStatus(user.id)} className="p-2 hover:bg-brand-dark/5 rounded-lg">
                    {user.is_active ? <UserX size={16} className="text-red-500" /> : <UserCheck size={16} className="text-green-500" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
