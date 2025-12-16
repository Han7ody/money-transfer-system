'use client';

import { useState } from 'react';

interface DocumentViewerProps {
  documents: any[];
  selectedDoc: any;
  onSelectDoc: (doc: any) => void;
}

export default function DocumentViewer({ documents, selectedDoc, onSelectDoc }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareDoc, setCompareDoc] = useState<any>(null);

  const getDocumentUrl = (doc: any) => {
    // Base URL without /api since uploads are served directly
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    // Handle view side selection for documents with front and back
    if (doc.viewSide === 'back' && doc.backImageUrl) {
      return `${baseUrl}${doc.backImageUrl}`;
    }
    
    // Handle new schema format
    if (doc.frontImageUrl) return `${baseUrl}${doc.frontImageUrl}`;
    if (doc.backImageUrl) return `${baseUrl}${doc.backImageUrl}`;
    // Handle old format (backward compatibility)
    if (doc.filePath) return `${baseUrl}/uploads/${doc.filePath}`;
    return '';
  };

  const getDocumentLabel = (doc: any) => {
    // Handle old format
    if (doc.type === 'id_front') return 'ID Front';
    if (doc.type === 'id_back') return 'ID Back';
    if (doc.type === 'selfie') return 'Selfie';
    
    // Handle new format
    if (doc.documentType === 'NATIONAL_ID' && doc.frontImageUrl && doc.backImageUrl) {
      return doc.backImageUrl ? 'ID (Front & Back)' : 'ID Front';
    }
    if (doc.documentType === 'SELFIE') return 'Selfie';
    if (doc.documentType === 'PASSPORT') return 'Passport';
    if (doc.documentType === 'DRIVERS_LICENSE') return 'Driver License';
    
    return doc.documentType || 'Document';
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 50));
  const handleRotate = () => setRotation((rotation + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const toggleCompare = () => {
    if (!compareMode && documents.length > 1) {
      const otherDoc = documents.find(d => d.id !== selectedDoc?.id);
      setCompareDoc(otherDoc);
    }
    setCompareMode(!compareMode);
  };

  if (!selectedDoc) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <p>No documents available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {documents.map((doc) => {
            // For documents with both front and back, create two buttons
            if (doc.frontImageUrl && doc.backImageUrl && doc.documentType === 'NATIONAL_ID') {
              return (
                <div key={doc.id} className="flex space-x-1">
                  <button
                    onClick={() => onSelectDoc({ ...doc, viewSide: 'front' })}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedDoc?.id === doc.id && selectedDoc?.viewSide === 'front'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    ID Front
                  </button>
                  <button
                    onClick={() => onSelectDoc({ ...doc, viewSide: 'back' })}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedDoc?.id === doc.id && selectedDoc?.viewSide === 'back'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    ID Back
                  </button>
                </div>
              );
            }
            
            return (
              <button
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedDoc?.id === doc.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {getDocumentLabel(doc)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            −
          </button>
          <span className="text-white text-sm">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            +
          </button>
          <button
            onClick={handleRotate}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            ↻
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
          {documents.length > 1 && (
            <button
              onClick={toggleCompare}
              className={`px-3 py-1 rounded ${
                compareMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Compare
            </button>
          )}
        </div>
      </div>

      {/* Document Display */}
      <div className="flex-1 overflow-auto p-4">
        {compareMode && compareDoc ? (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col items-center">
              <div className="text-white text-sm mb-2">{getDocumentLabel(selectedDoc)}</div>
              <img
                src={getDocumentUrl(selectedDoc)}
                alt={getDocumentLabel(selectedDoc)}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s'
                }}
                className="max-w-full h-auto"
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="text-white text-sm mb-2">{getDocumentLabel(compareDoc)}</div>
              <img
                src={getDocumentUrl(compareDoc)}
                alt={getDocumentLabel(compareDoc)}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s'
                }}
                className="max-w-full h-auto"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <img
              src={getDocumentUrl(selectedDoc)}
              alt={getDocumentLabel(selectedDoc)}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s'
              }}
              className="max-w-full max-h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
