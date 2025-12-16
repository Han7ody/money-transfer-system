'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slideUp');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all sections for scroll animations
    const sections = document.querySelectorAll('.scroll-animate');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-blue-800/20"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  حوالات دولية
                </span>
                <br />
                سريعة وآمنة
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-lg">
                أرسل واستقبل الأموال عبر العالم بأمان وسرعة مع أفضل أسعار الصرف وأقل الرسوم
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-center shadow-lg"
                >
                  إنشاء حساب
                </Link>
                <Link 
                  href="/login"
                  className="border-2 border-slate-600 hover:border-blue-500 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-slate-800/50 text-center backdrop-blur-sm"
                >
                  تسجيل الدخول
                </Link>
              </div>
            </div>

            {/* App Preview */}
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative">
                {/* Glowing effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl animate-pulse"></div>
                
                {/* App mockup placeholder */}
                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl">
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl h-80 sm:h-96 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto animate-bounce shadow-lg"></div>
                      <p className="text-slate-400 font-medium">معاينة التطبيق</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-slate-800/50 scroll-animate">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">لماذا تختارنا؟</h2>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
              نقدم لك أفضل خدمات التحويل المالي مع ضمان الأمان والسرعة
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: "🚀",
                title: "سرعة فائقة",
                description: "تحويلات فورية خلال دقائق"
              },
              {
                icon: "🔒",
                title: "أمان مضمون",
                description: "حماية متقدمة لأموالك ومعلوماتك"
              },
              {
                icon: "💰",
                title: "رسوم منخفضة",
                description: "أفضل الأسعار في السوق"
              },
              {
                icon: "🌍",
                title: "تغطية عالمية",
                description: "خدمة في أكثر من <span class='en-digits'>100</span> دولة"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400" dangerouslySetInnerHTML={{ __html: feature.description }}></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 scroll-animate">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">كيف يعمل؟</h2>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
              ثلاث خطوات بسيطة لإرسال الأموال
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: "👤",
                title: "إنشاء حساب",
                description: "سجل حسابك وأكمل التحقق من الهوية"
              },
              {
                step: "2", 
                icon: "💸",
                title: "أدخل التفاصيل",
                description: "حدد المبلغ والمستقبل وطريقة الدفع"
              },
              {
                step: "3",
                icon: "✅",
                title: "إرسال فوري",
                description: "أكد العملية واستلم رقم التتبع"
              }
            ].map((step, index) => (
              <div 
                key={index}
                className="text-center group"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold en-digits shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.step}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                </div>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-16 sm:py-20 bg-slate-800/30 scroll-animate">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                تطبيق متطور
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  لجميع احتياجاتك
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
                واجهة سهلة الاستخدام مع إشعارات فورية وتتبع مباشر لجميع تحويلاتك
              </p>
              <div className="space-y-4">
                {[
                  "تتبع مباشر للتحويلات",
                  "إشعارات فورية",
                  "محفوظات مفصلة",
                  "دعم فني 24/7"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 group">
                    <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              {/* Floating animation container */}
              <div className="relative floating-element">
                {/* Glowing background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-3xl blur-2xl"></div>
                
                {/* Mobile mockup */}
                <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-3xl p-4 border border-slate-600/50 shadow-2xl max-w-sm mx-auto">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl h-96 p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-slate-700/70 rounded w-3/4 animate-pulse"></div>
                      <div className="h-8 bg-gradient-to-r from-blue-600/70 to-purple-600/70 rounded animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-700/70 rounded w-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="h-3 bg-slate-700/70 rounded w-2/3 animate-pulse" style={{ animationDelay: '1.2s' }}></div>
                      </div>
                      <div className="h-12 bg-slate-700/70 rounded animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-8 bg-slate-700/70 rounded animate-pulse" style={{ animationDelay: '1.8s' }}></div>
                        <div className="h-8 bg-slate-700/70 rounded animate-pulse" style={{ animationDelay: '2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-sm py-12 border-t border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">الشركة</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">عنّا</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">سياسة الخصوصية</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">الشروط والأحكام</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">الدعم</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">الدعم</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">الأسئلة الشائعة</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block duration-300">اتصل بنا</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">اللغة</h3>
              <div className="flex gap-4">
                <button className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">عربي</button>
                <button className="text-slate-400 hover:text-white transition-colors en-text">English</button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">تابعنا</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-300 hover:scale-110">
                  <span className="text-sm">📱</span>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-300 hover:scale-110">
                  <span className="text-sm">📧</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/50 mt-8 pt-8 text-center text-slate-400">
            <p className="en-digits">© 2025 جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .floating-element {
          animation: float 6s ease-in-out infinite;
        }

        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }

        .scroll-animate {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }

        .scroll-animate.animate-slideUp {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
