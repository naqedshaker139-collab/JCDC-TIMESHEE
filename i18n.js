import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "dashboard": "Dashboard",
      "equipment": "Equipment",
      "drivers": "Drivers",
      "request_equipment": "Request Equipment",
      "request_history": "Request History",
      "equipment_timecard": "Equipment Time Card",
      
      // Dashboard
      "welcome": "Welcome to Equipment Management System",
      "total_equipment": "Total Equipment",
      "available_equipment": "Available Equipment",
      "total_drivers": "Total Drivers",
      "pending_requests": "Pending Requests",
      
      // Equipment
      "asset_no": "Asset No.",
      "equipment_name": "Equipment Name",
      "plate_serial_no": "Plate No./Serial No.",
      "shift_type": "Shift Type",
      "num_shifts_requested": "No. of Shifts Requested",
      "status": "Status",
      "zone_department": "Zone/Department",
      "mobilized_date": "Mobilized Date",
      "demobilization_date": "Demobilization Date",
      "company_supplier": "Company/Supplier",
      "remarks": "Remarks",
      "assigned_driver": "Assigned Driver",
      "add_equipment": "Add Equipment",
      "search_equipment": "Search equipment...",
      "unassigned": "Unassigned",
      
      // Equipment Categories
      "forklifts": "Forklifts",
      "telehandlers": "Telehandlers",
      "loaders": "Loaders",
      "rollers_compactors": "Rollers/Compactors",
      "excavators": "Excavators",
      "trucks": "Trucks",
      "cranes": "Cranes",
      "lifts": "Lifts",
      "graders": "Graders",
      
      // Drivers
      "driver_name": "Driver Name",
      "phone_number": "Phone Number",
      "eqama_number": "Iqama Number",
      "assigned_machine": "Assigned Machine",
      "add_driver": "Add Driver",
      "search_drivers": "Search drivers...",
      "call": "Call",
      "day_shift": "Day Shift",
      "night_shift": "Night Shift",
      
      // Requests
      "engineer_name": "Engineer Name",
      "requested_equipment": "Requested Equipment",
      "request_time": "Request Time",
      "notes": "Notes",
      "submit_request": "Submit Request",
      "request_reason": "Request Reason",
      
      // Status
      "available": "Available",
      "active": "Active",
      "in_use": "In Use",
      "maintenance": "Maintenance",
      "pending": "Pending",
      "approved": "Approved",
      "completed": "Completed",
      
      // Actions
      "search": "Search",
      "filter": "Filter",
      "submit": "Submit",
      "cancel": "Cancel",
      "save": "Save",
      "edit": "Edit",
      "delete": "Delete",
      "view": "View",
      "back": "Back",
      
      // General
      "language": "en"
    }
  },
  ar: {
    translation: {
      // Navigation
      "dashboard": "لوحة التحكم",
      "equipment": "المعدات",
      "drivers": "السائقين",
      "request_equipment": "طلب معدة",
      "request_history": "تاريخ الطلبات",
      "equipment_timecard": "بطاقة تشغيل المعدات",
      
      // Dashboard
      "welcome": "مرحباً بك في نظام إدارة المعدات",
      "total_equipment": "إجمالي المعدات",
      "available_equipment": "المعدات المتاحة",
      "total_drivers": "إجمالي السائقين",
      "pending_requests": "الطلبات المعلقة",
      
      // Equipment
      "asset_no": "رقم الأصل",
      "equipment_name": "اسم المعدة",
      "plate_serial_no": "رقم اللوحة/الرقم التسلسلي",
      "shift_type": "نوع الوردية",
      "num_shifts_requested": "عدد الورديات المطلوبة",
      "status": "الحالة",
      "zone_department": "المنطقة/القسم",
      "mobilized_date": "تاريخ التعبئة",
      "demobilization_date": "تاريخ التسريح",
      "company_supplier": "الشركة/المورد",
      "remarks": "ملاحظات",
      "assigned_driver": "السائق المخصص",
      "add_equipment": "إضافة معدة",
      "search_equipment": "البحث عن معدة...",
      "unassigned": "غير مخصص",
      
      // Equipment Categories
      "forklifts": "الرافعات الشوكية",
      "telehandlers": "الرافعات التلسكوبية",
      "loaders": "المحملات",
      "rollers_compactors": "الضاغطات",
      "excavators": "الحفارات",
      "trucks": "الشاحنات",
      "cranes": "الرافعات",
      "lifts": "المصاعد",
      "graders": "المسويات",
      
      // Drivers
      "driver_name": "اسم السائق",
      "phone_number": "رقم الهاتف",
      "eqama_number": "رقم الإقامة",
      "assigned_machine": "الآلة المخصصة",
      "add_driver": "إضافة سائق",
      "search_drivers": "البحث عن سائقين...",
      "call": "اتصال",
      "day_shift": "وردية النهار",
      "night_shift": "وردية الليل",
      
      // Requests
      "engineer_name": "اسم المهندس",
      "requested_equipment": "المعدة المطلوبة",
      "request_time": "وقت الطلب",
      "notes": "ملاحظات",
      "submit_request": "إرسال الطلب",
      "request_reason": "سبب الطلب",
      
      // Status
      "available": "متاح",
      "active": "نشط",
      "in_use": "قيد الاستخدام",
      "maintenance": "صيانة",
      "pending": "معلق",
      "approved": "موافق عليه",
      "completed": "مكتمل",
      
      // Actions
      "search": "بحث",
      "filter": "تصفية",
      "submit": "إرسال",
      "cancel": "إلغاء",
      "save": "حفظ",
      "edit": "تعديل",
      "delete": "حذف",
      "view": "عرض",
      "back": "رجوع",
      
      // General
      "language": "ar"
    }
  },
  zh: {
    translation: {
      // Navigation
      "dashboard": "仪表盘",
      "equipment": "设备",
      "drivers": "司机",
      "request_equipment": "设备申请",
      "request_history": "申请记录",
      
      // Dashboard
      "welcome": "欢迎使用设备管理系统",
      "total_equipment": "设备总数",
      "available_equipment": "可用设备",
      "total_drivers": "司机总数",
      "pending_requests": "待处理申请",
      "equipment_timecard": "设备工时卡",
      
      // Equipment
      "asset_no": "资产编号",
      "equipment_name": "设备名称",
      "plate_serial_no": "车牌号/序列号",
      "shift_type": "班次类型",
      "num_shifts_requested": "申请班次数量",
      "status": "状态",
      "zone_department": "区域/部门",
      "mobilized_date": "进场日期",
      "demobilization_date": "退场日期",
      "company_supplier": "公司/供应商",
      "remarks": "备注",
      "assigned_driver": "指定司机",
      "add_equipment": "新增设备",
      "search_equipment": "搜索设备...",
      "unassigned": "未分配",
      
      // Equipment Categories
      "forklifts": "叉车",
      "telehandlers": "伸缩臂叉装车",
      "loaders": "装载机",
      "rollers_compactors": "压路机/压实机",
      "excavators": "挖掘机",
      "trucks": "卡车",
      "cranes": "起重机",
      "lifts": "升降机",
      "graders": "平地机",
      
      // Drivers
      "driver_name": "司机姓名",
      "phone_number": "电话号码",
      "eqama_number": "居留证号",
      "assigned_machine": "分配设备",
      "add_driver": "新增司机",
      "search_drivers": "搜索司机...",
      "call": "拨打电话",
      "day_shift": "白班",
      "night_shift": "夜班",
      
      // Requests
      "engineer_name": "工程师姓名",
      "requested_equipment": "申请设备",
      "request_time": "申请时间",
      "notes": "备注",
      "submit_request": "提交申请",
      "request_reason": "申请原因",
      
      // Status
      "available": "可用",
      "active": "启用",
      "in_use": "使用中",
      "maintenance": "维修中",
      "pending": "待处理",
      "approved": "已批准",
      "completed": "已完成",
      
      // Actions
      "search": "搜索",
      "filter": "筛选",
      "submit": "提交",
      "cancel": "取消",
      "save": "保存",
      "edit": "编辑",
      "delete": "删除",
      "view": "查看",
      "back": "返回",
      
      // General
      "language": "zh"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;