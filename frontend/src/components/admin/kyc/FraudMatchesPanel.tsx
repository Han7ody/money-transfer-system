'use client';

interface FraudMatchesPanelProps {
  matches: any[];
}

export default function FraudMatchesPanel({ matches }: FraudMatchesPanelProps) {
  const getMatchTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DOCUMENT: '📄 Document',
      EMAIL: '📧 Email',
      PHONE: '📱 Phone',
      IP: '🌐 IP Address',
      DEVICE: '💻 Device'
    };
    return labels[type] || type;
  };

  const getMatchTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DOCUMENT: 'bg-red-100 text-red-800',
      EMAIL: 'bg-orange-100 text-orange-800',
      PHONE: 'bg-yellow-100 text-yellow-800',
      IP: 'bg-blue-100 text-blue-800',
      DEVICE: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">⚠ Fraud Matches</h3>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {matches.map((match: any) => (
          <div key={match.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
            <div className="flex items-start justify-between mb-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded ${getMatchTypeColor(match.matchType)}`}>
                {getMatchTypeLabel(match.matchType)}
              </span>
              <span className="text-xs font-semibold text-red-600">+{match.score} risk</span>
            </div>

            <div className="text-sm">
              <div className="font-medium text-gray-900">{match.matchedUser.fullName}</div>
              <div className="text-gray-600 text-xs">{match.matchedUser.email}</div>
              {match.matchValue && (
                <div className="text-gray-600 text-xs mt-1">
                  Match: <span className="font-mono">{match.matchValue}</span>
                </div>
              )}
              <div className="mt-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  match.matchedUser.kycStatus === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : match.matchedUser.kycStatus === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {match.matchedUser.kycStatus}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.open(`/admin/users/${match.matchedUser.id}`, '_blank')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View Profile →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
