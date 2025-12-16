'use client';

import { useState } from 'react';

interface KycActionModalProps {
  isOpen: boolean;
  actionType: string;
  fraudScore: number;
  onClose: () => void;
  onConfirm: (action: string, reason?: string) => void;
}

const reasonTemplates: Record<string, string[]> = {
  reject: [
    'Document image is unclear or blurry',
    'Document appears to be expired',
    'Document information does not match user profile',
    'Suspected fraudulent document',
    'Document type not acceptable'
  ],
  more: [
    'Please provide a clearer image of your ID',
    'Please upload both front and back of your ID',
    'Selfie photo does not match ID photo',
    'Additional verification documents required'
  ],
  escalate: [
    'High fraud risk score requires compliance review',
    'Multiple duplicate accounts detected',
    'Suspicious document patterns',
    'Requires senior compliance officer review'
  ]
};

export default function KycActionModal({ isOpen, actionType, fraudScore, onClose, onConfirm }: KycActionModalProps) {
  const [reason, setReason] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Show warning if approving high-risk user
    if (actionType === 'approve' && fraudScore >= 80 && !showWarning) {
      setShowWarning(true);
      return;
    }

    onConfirm(actionType, reason || undefined);
    setReason('');
    setShowWarning(false);
  };

  const getTitle = () => {
    switch (actionType) {
      case 'approve': return 'Approve KYC';
      case 'reject': return 'Reject KYC';
      case 'more': return 'Request More Documents';
      case 'escalate': return 'Escalate to Compliance';
      default: return 'Confirm Action';
    }
  };

  const getButtonColor = () => {
    switch (actionType) {
      case 'approve': return 'bg-green-600 hover:bg-green-700';
      case 'reject': return 'bg-red-600 hover:bg-red-700';
      case 'more': return 'bg-blue-600 hover:bg-blue-700';
      case 'escalate': return 'bg-orange-600 hover:bg-orange-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const requiresReason = actionType !== 'approve';
  const templates = reasonTemplates[actionType] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{getTitle()}</h2>

          {showWarning && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <span className="text-red-600 text-xl mr-2">⚠</span>
                <div>
                  <h3 className="font-semibold text-red-800">High Risk Warning</h3>
                  <p className="text-sm text-red-700 mt-1">
                    This user has a fraud score of {fraudScore}. Are you sure you want to approve?
                  </p>
                </div>
              </div>
            </div>
          )}

          {requiresReason && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason {requiresReason && <span className="text-red-500">*</span>}
              </label>
              
              {templates.length > 0 && (
                <div className="mb-3 space-y-1">
                  <p className="text-xs text-gray-600 mb-2">Quick templates:</p>
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setReason(template)}
                      className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason or select a template above..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {actionType === 'approve' && !showWarning && (
            <p className="text-sm text-gray-600 mb-4">
              This will approve the user's KYC and allow them to make transfers.
            </p>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={() => {
              onClose();
              setReason('');
              setShowWarning(false);
            }}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={requiresReason && !reason.trim()}
            className={`px-4 py-2 text-white rounded-md ${getButtonColor()} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showWarning ? 'Yes, Approve Anyway' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
