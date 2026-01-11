import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Truck,
  Forklift,
  Construction,
  Loader,
  RollerCoaster,
  Shovel,
  ArrowBigUp,
  Gauge,
  Phone,
  ArrowLeft,
  Building,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Utilities */
/* -------------------------------------------------------------------------- */

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
};

const includesAny = (name, keywords) => {
  const n = norm(name);
  return keywords.some((k) => n.includes(k));
};

/* Safe getters for API field variants */
const getName = (eq) => (eq?.equipment_name ?? eq?.name ?? '').trim();
const getStatus = (eq) => (eq?.status ?? eq?.equipment_status ?? '').trim();
const getAsset = (eq) => (eq?.asset_no ?? eq?.assetNo ?? '').trim();
const getPlate = (eq) => (eq?.plate_serial_no ?? eq?.plateSerialNo ?? '').trim();
const getLocation = (eq) => (eq?.location ?? '').trim();
const getInCharge = (eq) => (eq?.in_charge_name ?? '').trim();
const getDayDriverName = (eq) =>
  (eq?.day_shift_driver_name ?? eq?.dayDriverName ?? '').trim();
const getDayDriverPhone = (eq) =>
  (eq?.day_shift_driver_phone ?? eq?.dayDriverPhone ?? '').trim();
const getNightDriverName = (eq) =>
  (eq?.night_shift_driver_name ?? eq?.nightDriverName ?? '').trim();
const getNightDriverPhone = (eq) =>
  (eq?.night_shift_driver_phone ?? eq?.nightDriverPhone ?? '').trim();

/* -------------------------------------------------------------------------- */
/* Component */
/* -------------------------------------------------------------------------- */

export default function EquipmentList() {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    {
      id: 'forklifts',
      name: 'Forklifts',
      nameAr: 'الرافعات الشوكية',
      icon: Forklift,
      iconBg: 'bg-red-100',
      iconText: 'text-red-700',
      keywords: ['forklift 10ton', 'forklift 16ton', 'forklift'],
    },
    {
      id: 'telehandlers',
      name: 'Telehandlers',
      nameAr: 'الرافعات التلسكوبية',
      icon: Construction,
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-700',
      keywords: ['telehanlder', 'telehandler'],
    },
    {
      id: 'loaders',
      name: 'Loaders',
      nameAr: 'المحملات',
      icon: Loader,
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-700',
      keywords: ['backhoe loader', 'skid steel loader', 'wheel loader', 'loader'],
    },
    {
      id: 'rollers',
      name: 'Rollers/Compactors',
      nameAr: 'الضاغطات',
      icon: RollerCoaster,
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-700',
      keywords: [
        'roller compactor 3 ton',
        'roller compactor 10ton',
        'roller compactor',
        'roller',
        'compactor',
      ],
    },
    {
      id: 'excavators',
      name: 'Excavators',
      nameAr: 'الحفارات',
      icon: Shovel,
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-700',
      keywords: ['mini excavator', 'excavator'],
    },
    {
      id: 'trucks',
      name: 'Trucks',
      nameAr: 'الشاحنات',
      icon: Truck,
      iconBg: 'bg-slate-100',
      iconText: 'text-slate-700',
      keywords: [
        'water tanker(18000ltr)',
        'boom truck',
        'dumper truck',
        'traila truck',
        'concrete mixer truck',
        'fire truck',
        'lowbed',
        'trailer',
        'dyna-3ton',
        'tanker',
        'dumper',
        'mixer',
        'truck',
      ],
    },
    {
      id: 'cranes',
      name: 'Cranes',
      nameAr: 'الرافعات',
      icon: Building,
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-700',
      keywords: [
        'towercrane',
        'mobile crane -truck mounted',
        'mobile crane -rt',
        'mobile crane',
        'crawler crane',
        'crane',
      ],
    },
    {
      id: 'lifts',
      name: 'Manlifts/Scissor Lifts',
      nameAr: 'المنصات الهوائية/المقصية',
      icon: ArrowBigUp,
      iconBg: 'bg-pink-100',
      iconText: 'text-pink-700',
      keywords: [
        'manlift 22m with operator',
        'manlif 26m with operator',
        'scissor lift with operator',
        'manlift',
        'scissor lift',
        'lift',
      ],
    },
    {
      id: 'graders',
      name: 'Graders',
      nameAr: 'المسويات',
      icon: Gauge,
      iconBg: 'bg-teal-100',
      iconText: 'text-teal-700',
      keywords: ['grader'],
    },
  ];

  /* Fetch equipment from backend API */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/equipment', { credentials: 'include' });
        const raw = await res.json();
        const list = toArray(raw);
        if (!alive) return;
        setEquipment(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Error fetching /api/equipment:', e);
        if (alive) setEquipment([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* Category counts */
  const counts = useMemo(() => {
    const rows = Array.isArray(equipment) ? equipment : [];
    const map = {};
    for (const cat of categories) {
      map[cat.id] = rows.filter((eq) =>
        includesAny(getName(eq), cat.keywords)
      ).length;
    }
    return map;
  }, [equipment]);

  const rows = Array.isArray(equipment) ? equipment : [];

  const filteredEquipment = rows.filter((eq) => {
    const q = norm(searchTerm);
    const matchesSearch =
      norm(getName(eq)).includes(q) ||
      norm(getAsset(eq)).includes(q) ||
      norm(getPlate(eq)).includes(q) ||
      norm(getLocation(eq)).includes(q) ||
      norm(getInCharge(eq)).includes(q) ||
      norm(getStatus(eq)).includes(q);

  const matchesCategory = selectedCategory
      ? includesAny(
          getName(eq),
          (categories.find((c) => c.id === selectedCategory)?.keywords) || []
        )
      : true;

    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status = '') => {
    switch (norm(status)) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'in use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) window.open(`tel:${phoneNumber}`, '_self');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  /* Category grid view */
  if (!selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">
            {t('equipment')}
          </h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder={t('search_equipment')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = counts[category.id] ?? 0;
            return (
              <Card
                key={category.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-md border border-border bg-card"
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${category.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${category.iconText}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-slate-900">
                        {t('language') === 'ar'
                          ? category.nameAr
                          : category.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {count} {t('equipment')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {searchTerm && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Search Results ({filteredEquipment.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((eq) => (
                <EquipmentCard
                  key={eq.equipment_id ?? `${getAsset(eq)}-${getPlate(eq)}`}
                  equipment={eq}
                  onCall={handleCall}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* List view of one category */
  const selectedCategoryData = categories.find(
    (c) => c.id === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => setSelectedCategory(null)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('back')}</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('language') === 'ar'
              ? selectedCategoryData?.nameAr
              : selectedCategoryData?.name}
          </h1>
          <p className="text-slate-600">
            {filteredEquipment.length} {t('equipment')}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder={t('search_equipment')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((eq) => (
          <EquipmentCard
            key={eq.equipment_id ?? `${getAsset(eq)}-${getPlate(eq)}`}
            equipment={eq}
            onCall={handleCall}
          />
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">
            No equipment found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Child Card */
/* -------------------------------------------------------------------------- */

function EquipmentCard({ equipment, onCall }) {
  const { t } = useTranslation();

  const getStatusColor = (status = '') => {
    switch (norm(status)) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'in use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center text-slate-900">
            <Truck className="h-5 w-5 mr-2 text-primary" />
            {getName(equipment)}
          </CardTitle>
          <Badge className={getStatusColor(getStatus(equipment))}>
            {t(norm(getStatus(equipment)).replace(' ', '_'))}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-slate-600 font-medium">{t('asset_no')}</p>
              <p className="font-semibold text-slate-900">
                {getAsset(equipment)}
              </p>
            </div>
            <div>
              <p className="text-slate-600 font-medium">
                {t('plate_serial_no')}
              </p>
              <p className="font-semibold text-slate-900">
                {getPlate(equipment)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-slate-600 text-sm font-medium">
            {t('location')}
          </p>
          <p className="font-semibold text-slate-900">
            {getLocation(equipment)}
          </p>
          {getInCharge(equipment) && (
            <p className="text-xs text-slate-600 mt-1">
              {t('in_charge')}:{" "}
              <span className="font-medium text-slate-900">
                {getInCharge(equipment)}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-slate-600 text-sm font-medium">
            {t('assigned_driver')}
          </p>

          {getDayDriverName(equipment) && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-yellow-900">
                    {t('day_shift')}: {getDayDriverName(equipment)}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {getDayDriverPhone(equipment)}
                  </p>
                </div>
                {getDayDriverPhone(equipment) && (
                  <Button
                    size="sm"
                    onClick={() => onCall(getDayDriverPhone(equipment))}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {getNightDriverName(equipment) && (
            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-indigo-900">
                    {t('night_shift')}: {getNightDriverName(equipment)}
                  </p>
                  <p className="text-sm text-indigo-700">
                    {getNightDriverPhone(equipment)}
                  </p>
                </div>
                {getNightDriverPhone(equipment) && (
                  <Button
                    size="sm"
                    onClick={() => onCall(getNightDriverPhone(equipment))}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {!getDayDriverName(equipment) && !getNightDriverName(equipment) && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="font-medium text-slate-500">{t('unassigned')}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-600">{t('shift_type')}</p>
            <p className="font-medium">
              {equipment?.shift_type || ''}
            </p>
          </div>
          <div>
            <p className="text-slate-600">{t('company_supplier')}</p>
            <p className="font-medium">
              {equipment?.company_supplier || ''}
            </p>
          </div>
        </div>

        {equipment?.remarks && (
          <div>
            <p className="text-slate-600 text-sm">{t('remarks')}</p>
            <p className="font-medium text-slate-800">
              {equipment?.remarks}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}