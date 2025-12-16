'use client';

export default function TestColorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Tailwind CSS Color Test
        </h1>
        
        {/* Color Palette Test */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-500 text-white p-4 rounded-lg text-center">
            Red 500
          </div>
          <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
            Blue 500
          </div>
          <div className="bg-green-500 text-white p-4 rounded-lg text-center">
            Green 500
          </div>
          <div className="bg-yellow-500 text-white p-4 rounded-lg text-center">
            Yellow 500
          </div>
          <div className="bg-purple-500 text-white p-4 rounded-lg text-center">
            Purple 500
          </div>
          <div className="bg-pink-500 text-white p-4 rounded-lg text-center">
            Pink 500
          </div>
          <div className="bg-indigo-500 text-white p-4 rounded-lg text-center">
            Indigo 500
          </div>
          <div className="bg-gray-500 text-white p-4 rounded-lg text-center">
            Gray 500
          </div>
        </div>

        {/* Button Test */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Primary Button
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors">
            Success Button
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors">
            Danger Button
          </button>
        </div>

        {/* Card Test */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Card</h2>
          <p className="text-gray-600 mb-4">
            This is a test card to verify that Tailwind CSS is working properly.
          </p>
          <div className="flex gap-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Tag 1
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Tag 2
            </span>
          </div>
        </div>

        {/* Gradient Test */}
        <div className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white p-8 rounded-xl text-center">
          <h3 className="text-2xl font-bold">Gradient Background Test</h3>
          <p className="mt-2">This should show a colorful gradient background</p>
        </div>
      </div>
    </div>
  );
}