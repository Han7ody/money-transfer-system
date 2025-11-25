// frontend/src/app/(public)/unauthorized/page.tsx
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-6xl font-bold text-red-600">403</h1>
      <h2 className="text-3xl font-semibold mt-4 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-6">
        Sorry, you do not have the necessary permissions to access this page.
      </p>
      <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Go to Homepage
      </Link>
    </div>
  );
}
