'use client';

import { useState } from 'react';
import { X, Code, Activity, Shield, Route, Database } from 'lucide-react';

interface DebugPanelProps {
  onClose: () => void;
  debugData: {
    apiLogs?: any[];
    stateTransitions?: any[];
    permissionChecks?: any[];
    routingParams?: any;
    contextData?: any;
  };
}

export default function DebugPanel({ onClose, debugData }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'state' | 'permissions' | 'routing'>('api');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">وضع التصحيح الداخلي</h2>
              <p className="text-xs text-slate-400">Internal Debug Mode - للمطورين فقط</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800 px-6 border-b border-slate-700">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'api'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Database className="w-4 h-4" />
              API Logs
            </button>
            <button
              onClick={() => setActiveTab('state')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'state'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              State Transitions
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'permissions'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('routing')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'routing'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Route className="w-4 h-4" />
              Routing
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'api' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">API Request/Response Logs</h3>
              {debugData.apiLogs && debugData.apiLogs.length > 0 ? (
                debugData.apiLogs.map((log, index) => (
                  <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-mono px-2 py-1 rounded ${
                        log.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                        log.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                        log.method === 'PUT' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-xs text-slate-500">{log.timestamp}</span>
                    </div>
                    <div className="text-sm text-slate-300 font-mono mb-2">{log.url}</div>
                    {log.payload && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                          Request Payload
                        </summary>
                        <pre className="mt-2 text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.response && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                          Response
                        </summary>
                        <pre className="mt-2 text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No API logs captured yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'state' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">State Machine Transitions</h3>
              {debugData.stateTransitions && debugData.stateTransitions.length > 0 ? (
                debugData.stateTransitions.map((transition, index) => (
                  <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono px-2 py-1 rounded bg-slate-700 text-slate-300">
                        {transition.from}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="text-xs font-mono px-2 py-1 rounded bg-slate-700 text-slate-300">
                        {transition.to}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ml-auto ${
                        transition.valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transition.valid ? '✓ Valid' : '✗ Denied'}
                      </span>
                    </div>
                    {transition.reason && (
                      <div className="text-sm text-slate-400 mt-2">
                        Reason: {transition.reason}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-2">{transition.timestamp}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No state transitions recorded</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Permission Evaluation Traces</h3>
              {debugData.permissionChecks && debugData.permissionChecks.length > 0 ? (
                debugData.permissionChecks.map((check, index) => (
                  <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300 font-mono">{check.permission}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        check.granted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {check.granted ? '✓ Granted' : '✗ Denied'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Role: <span className="text-slate-300">{check.role}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">{check.timestamp}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No permission checks recorded</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'routing' && (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Current Route Parameters</h3>
                <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                  {JSON.stringify(debugData.routingParams || {}, null, 2)}
                </pre>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Context Data</h3>
                <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                  {JSON.stringify(debugData.contextData || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800 px-6 py-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Debug mode is enabled. This panel is only visible to internal developers.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
