import os
import sys
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
import tempfile

import pandas as pd
import requests

# Make project root importable and use root main.py (Neon DB)
BASE = Path(__file__).resolve().parent
if str(BASE) not in sys.path:
    sys.path.insert(0, str(BASE))

from main import app
from src.models.equipment import db, Equipment, Driver


# ------------ helpers ------------

def _is_url(path_or_url: str) -> bool:
    try:
        u = urlparse(path_or_url)
        return u.scheme in ("http", "https")
    except Exception:
        return False


def _download_to_tmp(url: str) -> str:
    r = requests.get(url, stream=True, timeout=120)
    r.raise_for_status()
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            if chunk:
                tmp.write(chunk)
        return tmp.name


def _norm(s):
    if s is None:
        return None
    s = str(s).strip()
    return s or None


def _id_str(v):
    """Normalize numeric IDs/phones like 6011252607.0 -> '6011252607'."""
    v = _norm(v)
    if v is None:
        return None
    try:
        f = float(v)
        if f.is_integer():
            return str(int(f))
    except Exception:
        pass
    return v


def parse_date(value):
    if value in (None, "", "NIL", "nil"):
        return None
    if isinstance(value, datetime):
        return value.date()
    text = str(value).split(" ")[0]
    for fmt in ("%d.%m.%Y", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def normalize_shift(shift_raw: str | None) -> str:
    """Return 'DAY', 'NIGHT', 'BOTH', or ''."""
    s = _norm(shift_raw)
    if not s:
        return ""
    s_upper = s.upper()
    if "DAY" in s_upper and "NIGHT" in s_upper:
        return "BOTH"
    if "DAY" in s_upper:
        return "DAY"
    if "NIGHT" in s_upper:
        return "NIGHT"
    return ""


def _find_column(df, candidates: list[str]) -> str | None:
    normalized = [str(col).strip().lower() for col in df.columns]
    for candidate in candidates:
        candidate_norm = candidate.strip().lower()
        for index, col_norm in enumerate(normalized):
            if col_norm == candidate_norm:
                return df.columns[index]
        for index, col_norm in enumerate(normalized):
            if candidate_norm in col_norm or col_norm in candidate_norm:
                return df.columns[index]
    return None


def _driver_unique_key(name: str | None, iqama: str | None, phone: str | None, row_index: int, role: str):
    if iqama:
        return iqama
    if phone:
        return f"PHONE:{phone}"
    if name:
        return f"NOIQAMA:{role}:{name}"
    return f"UNKNOWN:{row_index}:{role}"


def import_data_from_excel(excel_path: str):
    cleanup_tmp = None
    if _is_url(excel_path):
        print("Downloading Excel from URL...")
        tmp = _download_to_tmp(excel_path)
        cleanup_tmp = tmp
        excel_path = tmp

    print("DB URI:", app.config.get("SQLALCHEMY_DATABASE_URI"))
    print("Excel file path used:", excel_path)

    if not Path(excel_path).exists():
        raise FileNotFoundError(f"Excel path not found: {excel_path}")

    with app.app_context():
        print("Dropping and recreating tables...")
        db.drop_all()
        db.create_all()

        xlsx = pd.ExcelFile(excel_path)
        if "Supplier Equipment" in xlsx.sheet_names:
            sheet_name = "Supplier Equipment"
        elif "EquipmentList2026" in xlsx.sheet_names:
            sheet_name = "EquipmentList2026"
        else:
            sheet_name = xlsx.sheet_names[0]

        print(f"Reading sheet '{sheet_name}'...")
        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=0)
        df = df.where(pd.notna(df), None)

        print("Columns in sheet:", list(df.columns))

        col_map = {
            "equipment_name": _find_column(df, ["equipment_name", "serial number", " ", "capacity"]),
            "plate_serial_no": _find_column(df, ["plate_serial_no", "serial number", "plate serial no"]),
            "shift_type": _find_column(df, ["shift_type", "shift"]),
            "status": _find_column(df, ["status"]),
            "company_supplier": _find_column(df, ["company_supplier", "company/supplier", "supplier"]),
            "location": _find_column(df, ["location", "department"]),
            "in_charge_name": _find_column(df, ["in_charge_name", "in charge name", "responsible engr.", "responsible engineer"]),
            "mobilized_date": _find_column(df, ["mobilized_date", "mobilized date", "mobilization"]),
            "demobilized_date": _find_column(df, ["demobilization_date", "demobilization expected date", "demobization expected date", "demobization expected date"]),
            "remarks": _find_column(df, ["remarks"]),
            "day_driver_name": _find_column(df, ["day shift operator", "day shift operator ", "day shift operator  "]),
            "day_driver_iqama": _find_column(df, ["iqama no.", "iqama no", "iqama", "iqama no", "iqama no."]),
            "day_driver_phone": _find_column(df, ["mobile no.", "mobile no", "mobile", "mobile no", "mobile no."]),
            "night_driver_name": _find_column(df, ["night shift operator", "night shift operator ", "night shift operator  "]),
            "night_driver_iqama": _find_column(df, ["iqama no", "iqama no.", "iqama", "iqama no", "iqama no."]),
            "night_driver_phone": _find_column(df, ["mobile no", "mobile no.", "mobile", "mobile no", "mobile no."]),
        }

        inserted_eq = 0
        inserted_dr_new = 0
        reused_dr = 0

        equipment_by_plate: dict[str, Equipment] = {}
        drivers_by_iqama: dict[str, Driver] = {}

        def get_or_create_driver(name, iqama, phone, row_index, role):
            nonlocal inserted_dr_new, reused_dr
            if not name and not iqama and not phone:
                return None

            key = _driver_unique_key(name, iqama, phone, row_index, role)
            driver_obj = None
            if iqama:
                driver_obj = drivers_by_iqama.get(iqama)
                if driver_obj is None:
                    driver_obj = Driver.query.filter_by(eqama_number=iqama).first()
            else:
                driver_obj = drivers_by_iqama.get(key)

            if driver_obj:
                if name:
                    driver_obj.driver_name = name
                if phone:
                    driver_obj.phone_number = phone
                reused_dr += 1
                return driver_obj

            driver_obj = Driver(
                driver_name=name or "",
                phone_number=phone or "",
                eqama_number=iqama or key,
                day_shift_equipment_id=None,
                night_shift_equipment_id=None,
            )
            db.session.add(driver_obj)
            inserted_dr_new += 1
            if iqama:
                drivers_by_iqama[iqama] = driver_obj
            else:
                drivers_by_iqama[key] = driver_obj
            return driver_obj

        for row_index, row in df.iterrows():
            raw_plate = row.get(col_map["plate_serial_no"]) if col_map["plate_serial_no"] else None
            plate_no = _id_str(raw_plate)
            if not plate_no:
                continue

            raw_name = row.get(col_map["equipment_name"]) if col_map["equipment_name"] else None
            equipment_name = _norm(raw_name) or plate_no

            shift_raw = row.get(col_map["shift_type"]) if col_map["shift_type"] else None
            shift = normalize_shift(shift_raw)

            supplier = _norm(row.get(col_map["company_supplier"])) if col_map["company_supplier"] else None
            status = _norm(row.get(col_map["status"])) if col_map["status"] else None
            location = _norm(row.get(col_map["location"])) if col_map["location"] else None
            in_charge_name = _norm(row.get(col_map["in_charge_name"])) if col_map["in_charge_name"] else None
            mobilized = parse_date(row.get(col_map["mobilized_date"])) if col_map["mobilized_date"] else None
            demobilized = parse_date(row.get(col_map["demobilized_date"])) if col_map["demobilized_date"] else None
            remarks = _norm(row.get(col_map["remarks"])) if col_map["remarks"] else None

            if not equipment_name and not plate_no:
                continue

            eq = equipment_by_plate.get(plate_no)
            if eq is None:
                eq = Equipment(
                    asset_no=plate_no,
                    equipment_name=equipment_name,
                    plate_serial_no=plate_no,
                    shift_type=shift,
                    num_shifts_requested=None,
                    status=status,
                    zone_department=None,
                    company_supplier=supplier,
                    location=location,
                    in_charge_name=in_charge_name,
                    mobilized_date=mobilized,
                    demobilization_date=demobilized,
                    remarks=remarks,
                )
                db.session.add(eq)
                db.session.flush()
                equipment_by_plate[plate_no] = eq
                inserted_eq += 1
            else:
                if status:
                    eq.status = status
                if supplier:
                    eq.company_supplier = supplier
                if location:
                    eq.location = location
                if in_charge_name:
                    eq.in_charge_name = in_charge_name
                if remarks:
                    eq.remarks = remarks

            day_driver = {
                "name": _norm(row.get(col_map["day_driver_name"])) if col_map["day_driver_name"] else None,
                "iqama": _id_str(row.get(col_map["day_driver_iqama"])) if col_map["day_driver_iqama"] else None,
                "phone": _id_str(row.get(col_map["day_driver_phone"])) if col_map["day_driver_phone"] else None,
            }
            night_driver = {
                "name": _norm(row.get(col_map["night_driver_name"])) if col_map["night_driver_name"] else None,
                "iqama": _id_str(row.get(col_map["night_driver_iqama"])) if col_map["night_driver_iqama"] else None,
                "phone": _id_str(row.get(col_map["night_driver_phone"])) if col_map["night_driver_phone"] else None,
            }

            if day_driver["name"] or day_driver["iqama"] or day_driver["phone"]:
                driver_obj = get_or_create_driver(day_driver["name"], day_driver["iqama"], day_driver["phone"], row_index, "DAY")
                if driver_obj:
                    driver_obj.day_shift_equipment_id = eq.equipment_id

            if night_driver["name"] or night_driver["iqama"] or night_driver["phone"]:
                driver_obj = get_or_create_driver(night_driver["name"], night_driver["iqama"], night_driver["phone"], row_index, "NIGHT")
                if driver_obj:
                    driver_obj.night_shift_equipment_id = eq.equipment_id

            if shift == "BOTH" and not (day_driver["name"] or night_driver["name"]):
                driver_obj = get_or_create_driver(day_driver["name"] or night_driver["name"], day_driver["iqama"] or night_driver["iqama"], day_driver["phone"] or night_driver["phone"], row_index, "BOTH")
                if driver_obj:
                    driver_obj.day_shift_equipment_id = eq.equipment_id
                    driver_obj.night_shift_equipment_id = eq.equipment_id

        db.session.commit()
        print(f"Inserted Equipment rows: {inserted_eq}")
        print(f"New Driver rows inserted: {inserted_dr_new}")
        print(f"Existing Driver rows reused/updated: {reused_dr}")
        print("✅ Import completed successfully.")

    if cleanup_tmp:
        try:
            os.unlink(cleanup_tmp)
        except Exception:
            pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(
            "Please provide the Excel file path or URL, e.g.: "
            "python import_excel_data_workbook.py path\\to\\EquipmentList2026.xlsx"
        )
    import_data_from_excel(sys.argv[1])
