import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Menu, X, Globe } from 'lucide-react';

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isRTL = i18n.language === 'ar';

  const navigation = [
    { name: t('dashboard'), href: '/' },
    { name: t('equipment'), href: '/equipment' },
    { name: t('drivers'), href: '/drivers' },
    { name: t('request_equipment'), href: '/request' },
    { name: t('request_history'), href: '/requests' },
    // New: Equipment Time Card
  { name: t('equipment_timecard'), href: '/timesheets/new' },
  ];

  return (
    <div
      className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Navigation */}
      <nav className="shadow-lg bg-gradient-to-r from-black via-primary to-black border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left brand + desktop nav */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-primary-foreground text-xl font-bold tracking-wide">
                  JCDC, CRCC &amp; PMV EQUIPMENT
                </h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div
                  className={
                    isRTL
                      ? 'mr-10 flex items-baseline space-x-reverse space-x-4'
                      : 'ml-10 flex items-baseline space-x-4'
                  }
                >
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Language Switcher and Mobile menu button */}
            <div className="flex items-center space-x-4">
              {/* Language selector */}
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary-foreground" />
                <select
                  value={i18n.language}
                  onChange={(e) => {
                    const lang = e.target.value;
                    i18n.changeLanguage(lang);
                    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
                  }}
                  className="bg-transparent border border-white/30 text-primary-foreground text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-white/60"
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground hover:bg-white/10"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-primary">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;