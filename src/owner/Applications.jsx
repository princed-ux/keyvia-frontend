import React, { useEffect, useState } from "react";
import client from "../api/axios";
import { FileText, User, Mail, Phone, Check, X } from "lucide-react";
import Swal from "sweetalert2";

const OwnerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assuming backend endpoint exists: GET /api/applications/owner
  const fetchApplications = async () => {
    try {
      const res = await client.get("/api/applications/owner");
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch apps failed:", err);
      // Fallback for demo if endpoint fails
      setApplications([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleAction = async (id, status) => {
    try {
      await client.put(`/api/applications/${id}/status`, { status });
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
      Swal.fire("Success", `Application ${status} successfully`, "success");
    } catch (err) {
      Swal.fire("Error", "Action failed", "error");
    }
  };

  const getStatusBadge = (status) => {
    switch(status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText /> Rental/Sale Applications
      </h2>

      {loading ? (
        <div>Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded shadow text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-25" />
          <p>No applications received yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map(app => (
            <div key={app.id} className="bg-white border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              {/* Applicant Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                  <span className="text-sm text-gray-500">{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800">
                  {app.property_title || "Unknown Property"}
                </h3>
                
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2"><User size={14}/> {app.applicant_name}</div>
                  <div className="flex items-center gap-2"><Mail size={14}/> {app.applicant_email}</div>
                  <div className="flex items-center gap-2"><Phone size={14}/> {app.applicant_phone}</div>
                </div>
              </div>

              {/* Message */}
              <div className="flex-1 bg-gray-50 p-3 rounded text-sm text-gray-600 italic">
                "{app.message || "I am interested in this property. Please contact me."}"
              </div>

              {/* Actions */}
              {app.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(app.id, 'approved')}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(app.id, 'rejected')}
                    className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerApplications;