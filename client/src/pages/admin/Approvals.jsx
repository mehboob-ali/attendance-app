import { useEffect, useState } from "react";
import api from "../../lib/api";
import Layout from "../../components/Layout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function Approvals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/employees/pending");
      console.log("Pending approvals:", res.data);
      setPending(res.data);
    } catch (err) {
      console.error("Failed to fetch pending approvals", err);
      setError(
        err.response?.data?.message || "Failed to load pending approvals"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (employee) => {
    setSelectedEmployee(employee);
    // Auto-generate email from name
    const emailSuggestion = `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}@company.com`;
    setEmail(emailSuggestion);
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const confirmApprove = async () => {
    setProcessing(true);
    setError("");
    try {
      // Only send email if it was entered
      const payload = email.trim() ? { email } : {};
      await api.post(`/employees/${selectedEmployee._id}/approve`, payload);
      setSuccess(`${selectedEmployee.name} approved successfully!`);
      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
        fetchPending();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve employee");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = (employee) => {
    setSelectedEmployee(employee);
    setRejectionReason("");
    setShowRejectModal(true);
    setError("");
    setSuccess("");
  };

  const confirmReject = async () => {
    if (!rejectionReason || !rejectionReason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      await api.post(`/employees/${selectedEmployee._id}/reject`, {
        reason: rejectionReason,
      });
      setSuccess(`${selectedEmployee.name} rejected`);
      setTimeout(() => {
        setShowRejectModal(false);
        setSuccess("");
        fetchPending();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject employee");
    } finally {
      setProcessing(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <Layout title="Pending Approvals">
        <Card>
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-8 w-8 text-brand-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-3 text-slate-600">
              Loading pending approvals...
            </span>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Pending Approvals">
      {error && !showModal && !showRejectModal && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && !showModal && !showRejectModal && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {pending.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto text-slate-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-slate-600 text-lg font-medium">
              No pending approvals
            </p>
            <p className="text-slate-500 text-sm mt-2">
              All employee registrations have been processed
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>{pending.length}</strong> employee
            {pending.length !== 1 ? "s" : ""} waiting for approval
          </div>

          <div className="space-y-4">
            {pending.map((emp) => (
              <div
                key={emp._id}
                className="border border-slate-200 rounded-lg p-4 hover:border-brand-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {emp.name}
                    </h3>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Mobile:</span>
                        <span className="ml-2 font-medium font-mono">
                          {emp.mobileNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Gender:</span>
                        <span className="ml-2 font-medium capitalize">
                          {emp.gender}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Date of Birth:</span>
                        <span className="ml-2 font-medium">
                          {new Date(emp.dateOfBirth).toLocaleDateString()}
                          <span className="text-slate-500">
                            {" "}
                            ({calculateAge(emp.dateOfBirth)} years old)
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Registered:</span>
                        <span className="ml-2 font-medium">
                          {new Date(emp.registeredAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {emp.middleName && (
                      <p className="text-xs text-slate-500 mt-2">
                        Full name: {emp.firstName} {emp.middleName}{" "}
                        {emp.lastName}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleApprove(emp)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(emp)}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      ✗ Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Approve Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              Approve Employee Registration
            </h3>

            {error && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-sm">
                {success}
              </div>
            )}

            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm">
                <strong>Name:</strong> {selectedEmployee.name}
              </p>
              <p className="text-sm">
                <strong>Mobile:</strong> {selectedEmployee.mobileNumber}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Assign Company Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="employee@company.com"
                disabled={processing}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                This will be their login email
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={confirmApprove}
                disabled={processing} // Remove the '!email.trim()' check
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {processing ? "Approving..." : "✓ Confirm Approval"}
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                  setSuccess("");
                }}
                disabled={processing}
                className="bg-slate-600 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              Reject Employee Registration
            </h3>

            {error && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-sm">
                {success}
              </div>
            )}

            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm">
                <strong>Name:</strong> {selectedEmployee.name}
              </p>
              <p className="text-sm">
                <strong>Mobile:</strong> {selectedEmployee.mobileNumber}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input w-full"
                rows="3"
                placeholder="Provide a reason for rejection..."
                disabled={processing}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={confirmReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 bg-rose-600 hover:bg-rose-700"
              >
                {processing ? "Rejecting..." : "✗ Confirm Rejection"}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setError("");
                  setSuccess("");
                }}
                disabled={processing}
                className="bg-slate-600 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
