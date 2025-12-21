import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, ClipboardList, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total_equipment: 0,
    available_equipment: 0,
    total_drivers: 0,
    pending_requests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('total_equipment'),
      value: stats.total_equipment,
      icon: Truck,
      iconBg: 'bg-red-100',
      iconText: 'text-red-700',
    },
    {
      title: t('available_equipment'),
      value: stats.available_equipment,
      icon: Truck,
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-700',
    },
    {
      title: t('total_drivers'),
      value: stats.total_drivers,
      icon: Users,
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-700',
    },
    {
      title: t('pending_requests'),
      value: stats.pending_requests,
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-700',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">
          {t('welcome')}
        </h1>
        <p className="text-slate-600 text-sm">
          China Railway Construction Corporation - Jeddah Stadium Project
        </p>
        <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-black via-primary to-black" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow border border-border bg-card"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {stat.title}
                </CardTitle>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${stat.iconBg}`}
                >
                  <IconComponent className={`h-4 w-4 ${stat.iconText}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/equipment"
            className="flex items-center p-4 rounded-lg border border-slate-200 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Truck className="h-8 w-8 text-red-700 mr-3" />
            <div>
              <h3 className="font-medium text-slate-900">{t('equipment')}</h3>
              <p className="text-sm text-slate-600">View all equipment</p>
            </div>
          </a>

          <a
            href="/drivers"
            className="flex items-center p-4 rounded-lg border border-slate-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <Users className="h-8 w-8 text-emerald-700 mr-3" />
            <div>
              <h3 className="font-medium text-slate-900">{t('drivers')}</h3>
              <p className="text-sm text-slate-600">View driver directory</p>
            </div>
          </a>

          <a
            href="/request"
            className="flex items-center p-4 rounded-lg border border-slate-200 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <ClipboardList className="h-8 w-8 text-amber-700 mr-3" />
            <div>
              <h3 className="font-medium text-slate-900">
                {t('request_equipment')}
              </h3>
              <p className="text-sm text-slate-600">Request equipment</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;