import React, { useEffect, useState } from "react";
import client from "../api/axios"; // Adjust path if needed (e.g. "../api/axios")
import { Link } from "react-router-dom";
import { Trash2, Edit, MapPin } from "lucide-react";
import Swal from "sweetalert2";

const OwnerProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch properties belonging to the logged-in owner
  const fetchProperties = async () => {
    try {
      // Reusing the agent endpoint as it filters by 'created_by' / 'agent_unique_id'
      const res = await client.get("/api/listings/agent"); 
      setProperties(res.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  // Handle Delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Property?',
      text: "This cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await client.delete(`/api/listings/${id}`);
        setProperties(prev => prev.filter(p => p.product_id !== id));
        Swal.fire('Deleted!', 'Property has been removed.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to delete property.', 'error');
      }
    }
  };

  if (loading) return <div className="p-6">Loading properties...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Properties</h2>
        <Link to="/owner/add-property" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Add New
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
          <p className="mb-4">You haven't listed any properties yet.</p>
          <Link to="/owner/add-property" className="text-blue-600 font-semibold hover:underline">
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <div key={p.product_id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              {/* Image */}
              <img 
                src={p.photos?.[0]?.url || "/placeholder.png"} 
                alt={p.title} 
                className="w-full h-48 object-cover"
              />
              
              <div className="p-4">
                {/* Status Badge & Price */}
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    p.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : p.status === 'rejected' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                  <span className="font-bold text-blue-600">
                    {p.price_currency} {Number(p.price).toLocaleString()}
                  </span>
                </div>

                {/* Title & Location */}
                <h3 className="font-semibold text-lg truncate mb-1">{p.title}</h3>
                <p className="text-gray-500 text-sm flex items-center mb-4">
                  <MapPin size={14} className="mr-1" /> {p.city || "Unknown City"}
                </p>
                
                {/* Actions */}
                <div className="flex gap-2 border-t pt-3">
                  <Link 
                    to={`/owner/edit-property/${p.product_id}`} 
                    className="flex-1 flex justify-center items-center gap-2 py-2 text-gray-700 hover:bg-gray-50 rounded transition"
                  >
                    <Edit size={16} /> Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(p.product_id)} 
                    className="flex-1 flex justify-center items-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerProperties;