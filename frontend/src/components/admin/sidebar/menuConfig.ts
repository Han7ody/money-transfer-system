import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  ShieldCheck, 
  Briefcase, 
  Settings, 
  Mail,
  Lock,
  DollarSign,
  FileText,
  LogIn,
  Activity,
  HelpCircle,
  LucideIcon,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Bell,
  Folder,
  Shield,
  Gauge,
  Monitor,
  UserCog,
  Key,
  Server,
  History,
  ScrollText,
  Inbox
} from 'lucide-react';

export interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: MenuItem[];
}

export const adminMenuItems: MenuItem[] = [
  {
    name: 'الرئيسية',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'المعاملات',
    href: '/admin/transactions',
    icon: Receipt
  },
  {
    name: 'المستخدمون',
    href: '/admin/users',
    icon: Users
  },
  {
    name: 'مراجعة توثيق الهوية',
    href: '/admin/kyc',
    icon: ShieldCheck
  },
  {
    name: 'الامتثال والمراقبة',
    href: '/admin/compliance',
    icon: AlertTriangle,
    children: [
      {
        name: 'لوحة الامتثال',
        href: '/admin/compliance/dashboard',
        icon: BarChart3
      },
      {
        name: 'تنبيهات AML',
        href: '/admin/compliance/aml-alerts',
        icon: Bell
      },
      {
        name: 'حالات AML',
        href: '/admin/compliance/cases',
        icon: Folder
      },
      {
        name: 'التقارير',
        href: '/admin/compliance/reports',
        icon: FileText
      }
    ]
  },
  {
    name: 'الوكلاء',
    href: '/admin/agents',
    icon: Briefcase
  },
  {
    name: 'الإعدادات',
    href: '/admin/settings',
    icon: Settings,
    children: [
      {
        name: 'إدارة المشرفين',
        href: '/admin/settings/admins',
        icon: UserCog
      },
      {
        name: 'إدارة الصلاحيات',
        href: '/admin/settings/roles',
        icon: Key
      },
      {
        name: 'قوالب البريد',
        href: '/admin/settings/email-templates',
        icon: Inbox
      },
      {
        name: 'إعدادات SMTP',
        href: '/admin/settings/smtp',
        icon: Server
      },
      {
        name: 'أسعار الصرف',
        href: '/admin/settings/exchange-rates',
        icon: TrendingUp
      },
      {
        name: 'الحدود والأمان',
        href: '/admin/security/rate-limits',
        icon: Lock
      },
      {
        name: 'القائمة البيضاء IP',
        href: '/admin/security/ip-whitelist',
        icon: Shield
      },
      {
        name: 'العملات والرسوم',
        href: '/admin/settings/currencies',
        icon: DollarSign
      }
    ]
  },
  {
    name: 'الدعم الفني',
    href: '/admin/support',
    icon: HelpCircle
  },
  {
    name: 'الأمان',
    href: '/admin/security',
    icon: Lock,
    children: [
      {
        name: 'القائمة البيضاء IP',
        href: '/admin/security/ip-whitelist',
        icon: Shield
      },
      {
        name: 'الحدود والقيود',
        href: '/admin/security/rate-limits',
        icon: Gauge
      },
      {
        name: 'الجلسات النشطة',
        href: '/admin/security/sessions',
        icon: Monitor
      },
      {
        name: 'سجل الدخول',
        href: '/admin/security/login-history',
        icon: LogIn
      }
    ]
  }
];
