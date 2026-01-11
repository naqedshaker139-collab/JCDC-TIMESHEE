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


# ------------ main import ------------

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

        # Read the main sheet by name; adjust if tab name ever changes
        SHEET_NAME = "Supplier Equipment"
        print(f"Reading sheet '{SHEET_NAME}'...")
        df = pd.read_excel(excel_path, sheet_name=SHEET_NAME, header=0)
        df = df.where(pd.notna(df), None)

        print("Columns in sheet:", list(df.columns))

        # Expected columns now include:
        # 'Si No', 'equipment_name', 'FLEET CODE', 'plate_serial_no',
        # 'shift_type', 'MOBILIZATION', 'DEMOBILIZATION',
        # 'driver_name', 'driver_iqama', 'driver_phone',
        # 'company_supplier', 'status', 'Location', 'In Charge Name'

        inserted_eq = 0
        inserted_dr_new = 0
        reused_dr = 0

        # Key: plate_serial_no -> Equipment instance
        equipment_by_plate: dict[str, Equipment] = {}
        # Key: driver_iqama -> Driver instance (to enforce drivers_eqama_number_key)
        drivers_by_iqama: dict[str, Driver] = {}

        for _, row in df.iterrows():
            equipment_name = _norm(row.get("equipment_name"))
            plate_no = _id_str(row.get("plate_serial_no"))
            shift_raw = row.get("shift_type")
            shift = normalize_shift(shift_raw)

            driver_name = _norm(row.get("driver_name"))
            driver_iqama = _id_str(row.get("driver_iqama"))
            driver_phone = _id_str(row.get("driver_phone"))

            supplier = _norm(row.get("company_supplier"))
            status = _norm(row.get("status"))

            # NEW: read Location and In Charge Name from Excel
            location = _norm(row.get("Location"))
            in_charge_name = _norm(row.get("In Charge Name"))

            # If you have mobilization/demobilization columns and want to use them:
            # mobilized = parse_date(row.get("MOBILIZATION"))
            # demobilized = parse_date(row.get("DEMOBILIZATION"))
            mobilized = None
            demobilized = None

            # There is no "remarks" column in this new sheet; keep None unless you add one
            remarks = None

            # Skip completely empty rows
            if not equipment_name and not plate_no:
                continue

            # Require plate_serial_no as the unique equipment key
            if not plate_no:
                print("Skipping row without plate_serial_no:", equipment_name)
                continue

            # --- upsert Equipment by plate ---
            eq = equipment_by_plate.get(plate_no)

            if eq is None:
                # Use plate_serial_no as asset_no to satisfy NOT NULL + UNIQUE
                eq = Equipment(
                    asset_no=plate_no,
                    equipment_name=equipment_name,
                    plate_serial_no=plate_no,
                    shift_type="",  # drivers carry shift info
                    num_shifts_requested=None,
                    status=status,
                    zone_department=None,  # no longer used; we rely on location
                    company_supplier=supplier,
                    location=location,
                    in_charge_name=in_charge_name,
                    mobilized_date=mobilized,
                    demobilization_date=demobilized,
                    remarks=remarks,
                )
                db.session.add(eq)
                db.session.flush()  # get equipment_id
                equipment_by_plate[plate_no] = eq
                inserted_eq += 1
            else:
                # Optionally update status/supplier/location/in_charge/remarks from later rows
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

            # --- upsert Driver by iqama (respect unique constraint) ---
            iqama_key = driver_iqama or None  # None or string
            driver_obj = None

            if iqama_key:
                # Reuse in-memory if seen in this run
                driver_obj = drivers_by_iqama.get(iqama_key)
                if driver_obj is None:
                    # Or from DB (should be empty after drop_all, but safe)
                    driver_obj = Driver.query.filter_by(eqama_number=iqama_key).first()
                if driver_obj:
                    # Update data if new info provided
                    if driver_name:
                        driver_obj.driver_name = driver_name
                    if driver_phone:
                        driver_obj.phone_number = driver_phone
                    reused_dr += 1

            if (driver_name or driver_iqama or driver_phone) and driver_obj is None:
                # New driver record
                driver_obj = Driver(
                    driver_name=driver_name or "",
                    phone_number=driver_phone or "",
                    eqama_number=driver_iqama or "",
                    day_shift_equipment_id=None,
                    night_shift_equipment_id=None,
                )
                db.session.add(driver_obj)
                inserted_dr_new += 1
                if iqama_key:
                    drivers_by_iqama[iqama_key] = driver_obj

            # Attach driver_obj to equipment according to shift
            if driver_obj:
                if shift in ("DAY", "BOTH"):
                    driver_obj.day_shift_equipment_id = eq.equipment_id
                if shift in ("NIGHT", "BOTH"):
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
            "python import_excel_data.py path\\to\\EquipmentList2026.xlsx"
        )
    import_data_from_excel(sys.argv[1])