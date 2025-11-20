import { redirect } from 'next/navigation';

export default function Home() {
  // إعادة توجيه المستخدم تلقائياً إلى صفحة تسجيل الدخول
  redirect('/login');
  return null;
}
