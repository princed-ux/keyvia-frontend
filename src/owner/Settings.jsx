import React from "react";
import Swal from "sweetalert2";

const OwnerSettings = () => {
  const handleChangePassword = () => {
    // Implement password change logic here or open modal
    Swal.fire("Info", "Password change functionality coming soon!", "info");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <div className="bg-white shadow rounded-lg divide-y">
        <div className="p-4 flex justify-between items-center">
          <div>
            <h3 className="font-medium">Notifications</h3>
            <p className="text-sm text-gray-500">Receive email alerts for new inquiries</p>
          </div>
          <input type="checkbox" className="toggle" defaultChecked />
        </div>

        <div className="p-4 flex justify-between items-center">
          <div>
            <h3 className="font-medium">Profile Visibility</h3>
            <p className="text-sm text-gray-500">Make my contact info visible on listings</p>
          </div>
          <input type="checkbox" className="toggle" defaultChecked />
        </div>

        <div className="p-4">
          <h3 className="font-medium mb-2">Security</h3>
          <button onClick={handleChangePassword} className="text-blue-600 hover:underline">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerSettings;