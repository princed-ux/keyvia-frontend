import React, { useEffect, useState } from "react";
import client from "../api/axios";
import { Bell, CheckCircle, Trash2, Info, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";

const OwnerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await client.get("/api/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id) => {
    try {
      await client.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await client.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await client.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.info("Notification removed");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="text-green-500" />;
      case 'warning': return <AlertTriangle className="text-yellow-500" />;
      default: return <Info className="text-blue-500" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell /> Notifications
        </h2>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading updates...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500">
          <Bell size={48} className="mx-auto mb-4 opacity-20" />
          <p>You're all caught up! No new notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                notif.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="mt-1">{getIcon(notif.type)}</div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-semibold ${notif.is_read ? 'text-gray-800' : 'text-blue-800'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
              </div>

              <div className="flex flex-col gap-2">
                {!notif.is_read && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="p-1 hover:bg-blue-200 rounded text-blue-600"
                    title="Mark as Read"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notif.id)}
                  className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerNotifications;