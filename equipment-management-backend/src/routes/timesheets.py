from datetime import date, datetime, time

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from src.models.equipment import db, Equipment, Driver
from src.models.timesheet import Timesheet, TimesheetDay, TimesheetApproval

timesheets_bp = Blueprint("timesheets_bp", __name__)


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def _parse_time(value: str | None) -> time | None:
    if not value:
        return None
    # Expect HH:MM or HH:MM:SS
    parts = value.split(":")
    if len(parts) == 2:
        h, m = parts
        return time(int(h), int(m))
    h, m, s = parts
    return time(int(h), int(m), int(s))


def _calculate_hours(row: TimesheetDay):
    """Recalculate regular, overtime, total_using_hrs."""
    if not row.time_start or not row.time_end:
        row.regular_working_hrs = None
        row.overtime_hrs = None
        row.total_using_hrs = None
        return

    dt_start = datetime.combine(row.log_date, row.time_start)
    dt_end = datetime.combine(row.log_date, row.time_end)
    seconds = max((dt_end - dt_start).total_seconds(), 0)
    raw_hours = seconds / 3600.0

    duty = float(row.duty_break_hrs or 0)
    net_hours = max(raw_hours - duty, 0.0)

    # CRCC rule: 10 hours regular, rest OT – adjust if needed
    regular = min(net_hours, 10.0)
    overtime = max(net_hours - regular, 0.0)
    total = regular + overtime

    row.regular_working_hrs = regular
    row.overtime_hrs = overtime
    row.total_using_hrs = total


def _serialize_timesheet(ts: Timesheet):
    equipment = ts.equipment
    driver = ts.driver
    approval = ts.approvals[0] if ts.approvals else None

    return {
        "timesheet_id": ts.timesheet_id,
        "month_year": ts.month_year.isoformat(),
        "project_location": ts.project_location,
        "status": ts.status,
        "supplier_name": ts.supplier_name,
        "chassis_no": ts.chassis_no,
        "start_meter": float(ts.start_meter) if ts.start_meter is not None else None,
        "end_meter": float(ts.end_meter) if ts.end_meter is not None else None,
        "diesel_consumption_ltrs": float(ts.diesel_consumption_ltrs)
        if ts.diesel_consumption_ltrs is not None
        else None,
        "equipment": {
            "equipment_id": equipment.equipment_id,
            "equipment_name": equipment.equipment_name,
            "plate_serial_no": equipment.plate_serial_no,
        },
        "driver": {
            "driver_id": driver.driver_id,
            "driver_name": driver.driver_name,
            "eqama_number": driver.eqama_number,
            "phone_number": driver.phone_number,
        },
        "days": [
            {
                "day_id": d.day_id,
                "log_date": d.log_date.isoformat(),
                "time_start": d.time_start.isoformat() if d.time_start else None,
                "time_end": d.time_end.isoformat() if d.time_end else None,
                "duty_break_hrs": float(d.duty_break_hrs or 0),
                "regular_working_hrs": float(d.regular_working_hrs)
                if d.regular_working_hrs is not None
                else None,
                "overtime_hrs": float(d.overtime_hrs)
                if d.overtime_hrs is not None
                else None,
                "total_using_hrs": float(d.total_using_hrs)
                if d.total_using_hrs is not None
                else None,
                "breakdown_reason": d.breakdown_reason,
            }
            for d in sorted(ts.days, key=lambda x: x.log_date)
        ],
        "approval": {
            "status": approval.status if approval else None,
            "role": approval.role if approval else None,
            "comment": approval.comment if approval else None,
            "acted_at": approval.acted_at.isoformat()
            if approval and approval.acted_at
            else None,
            "approver_user_id": approval.approver_user_id if approval else None,
        }
        if approval
        else None,
    }


@login_required
@timesheets_bp.post("/timesheets")
def create_timesheet():
    """
    Create (or fetch) a timesheet for given equipment, driver, month_year.
    month_year is 'YYYY-MM-01' (first day of month).

    In v1, any logged-in user (you as PMV/admin) can create a timesheet.
    We do not assign a specific approver_user_id yet; any Site Engineer
    can approve later.
    """
    data = request.get_json() or {}
    equipment_id = data.get("equipment_id")
    driver_id = data.get("driver_id")
    month_year_str = data.get("month_year")

    if not equipment_id or not driver_id or not month_year_str:
        return jsonify({"error": "equipment_id, driver_id, month_year required"}), 400

    month_year = _parse_date(month_year_str)
    if month_year is None:
        return jsonify({"error": "invalid month_year"}), 400

    equipment = Equipment.query.get(equipment_id)
    driver = Driver.query.get(driver_id)
    if not equipment or not driver:
        return jsonify({"error": "invalid equipment_id or driver_id"}), 404

    ts = (
        Timesheet.query.filter_by(
            equipment_id=equipment_id,
            driver_id=driver_id,
            month_year=month_year,
        )
        .order_by(Timesheet.timesheet_id.desc())
        .first()
    )
    if not ts:
        ts = Timesheet(
            equipment_id=equipment_id,
            driver_id=driver_id,
            month_year=month_year,
            project_location=data.get("project_location") or "HAYA AL ANDLUS",
            supplier_name=equipment.company_supplier,
            chassis_no=getattr(equipment, "chassis_no", None),
            status="draft",
        )
        db.session.add(ts)
        db.session.flush()

        # Single-level approval: Site Engineer.
        # We do NOT fix approver_user_id here; any Site Engineer can approve in v1.
        approval = TimesheetApproval(
            timesheet_id=ts.timesheet_id,
            level=1,
            role="SiteEngineer",
            approver_user_id=None,
            status="pending",
        )
        db.session.add(approval)
        db.session.commit()

    return jsonify(_serialize_timesheet(ts))


@login_required
@timesheets_bp.get("/timesheets/<int:timesheet_id>")
def get_timesheet(timesheet_id: int):
    ts = Timesheet.query.get(timesheet_id)
    if not ts:
        return jsonify({"error": "Timesheet not found"}), 404
    return jsonify(_serialize_timesheet(ts))


@login_required
@timesheets_bp.post("/timesheets/<int:timesheet_id>/clock-in")
def clock_in(timesheet_id: int):
    data = request.get_json() or {}
    date_str = data.get("log_date")
    log_date = _parse_date(date_str) or date.today()

    ts = Timesheet.query.get(timesheet_id)
    if not ts:
        return jsonify({"error": "Timesheet not found"}), 404

    day = TimesheetDay.query.filter_by(
        timesheet_id=ts.timesheet_id, log_date=log_date
    ).first()

    now = datetime.utcnow().time()

    if not day:
        day = TimesheetDay(
            timesheet_id=ts.timesheet_id,
            log_date=log_date,
            time_start=now,
            duty_break_hrs=1,
        )
        db.session.add(day)
    else:
        if day.time_start is None:
            day.time_start = now
        else:
            return jsonify({"error": "Already clocked in"}), 400

    _calculate_hours(day)
    db.session.commit()
    return jsonify(_serialize_timesheet(ts))


@login_required
@timesheets_bp.post("/timesheets/<int:timesheet_id>/clock-out")
def clock_out(timesheet_id: int):
    data = request.get_json() or {}
    date_str = data.get("log_date")
    log_date = _parse_date(date_str) or date.today()

    ts = Timesheet.query.get(timesheet_id)
    if not ts:
        return jsonify({"error": "Timesheet not found"}), 404

    day = TimesheetDay.query.filter_by(
        timesheet_id=ts.timesheet_id, log_date=log_date
    ).first()

    if not day or day.time_start is None:
        return jsonify({"error": "No clock-in found for this date"}), 400
    if day.time_end is not None:
        return jsonify({"error": "Already clocked out"}), 400

    day.time_end = datetime.utcnow().time()
    _calculate_hours(day)
    db.session.commit()
    return jsonify(_serialize_timesheet(ts))


@login_required
@timesheets_bp.patch("/timesheets/days/<int:day_id>")
def update_day(day_id: int):
    """Edit a daily row (time start/end, break hours, breakdown)."""
    day = TimesheetDay.query.get(day_id)
    if not day:
        return jsonify({"error": "Day not found"}), 404

    data = request.get_json() or {}

    if "time_start" in data:
        day.time_start = _parse_time(data.get("time_start"))
    if "time_end" in data:
        day.time_end = _parse_time(data.get("time_end"))
    if "duty_break_hrs" in data:
        try:
            day.duty_break_hrs = float(data.get("duty_break_hrs") or 0)
        except ValueError:
            return jsonify({"error": "invalid duty_break_hrs"}), 400
    if "breakdown_reason" in data:
        day.breakdown_reason = data.get("breakdown_reason")

    _calculate_hours(day)
    db.session.commit()
    return jsonify(_serialize_timesheet(day.timesheet))


@login_required
@timesheets_bp.post("/timesheets/<int:timesheet_id>/submit")
def submit_timesheet(timesheet_id: int):
    ts = Timesheet.query.get(timesheet_id)
    if not ts:
        return jsonify({"error": "Timesheet not found"}), 404

    # In v1, any logged-in user (e.g., you as PMV/admin) can submit.
    ts.status = "submitted"
    db.session.commit()
    return jsonify(_serialize_timesheet(ts))


@login_required
@timesheets_bp.get("/timesheets/pending")
def list_pending_for_site_engineer():
    """
    List all timesheets that are submitted and waiting for Site Engineer approval.
    In v1, we don't restrict by approver_user_id; any Site Engineer can see them.
    """
    approvals = TimesheetApproval.query.filter_by(
        level=1, role="SiteEngineer", status="pending"
    ).all()
    timesheets = [a.timesheet for a in approvals]
    return jsonify([_serialize_timesheet(ts) for ts in timesheets])


@login_required
@timesheets_bp.post("/timesheets/<int:timesheet_id>/approve")
def approve_timesheet(timesheet_id: int):
    data = request.get_json() or {}
    comment = data.get("comment") or ""

    ts = Timesheet.query.get(timesheet_id)
    if not ts:
        return jsonify({"error": "Timesheet not found"}), 404

    approval = (
        TimesheetApproval.query.filter_by(
            timesheet_id=ts.timesheet_id, level=1, role="SiteEngineer"
        )
        .order_by(TimesheetApproval.approval_id.desc())
        .first()
    )
    if not approval:
        return jsonify({"error": "Approval record not found"}), 400

    # Only enforce approver_user_id when explicitly set.
    if approval.approver_user_id and approval.approver_user_id != current_user.user_id:
        return jsonify({"error": "Not authorized for approval"}), 403

    approval.status = "approved"
    approval.comment = comment
    approval.acted_at = datetime.utcnow()
    ts.status = "approved"

    db.session.commit()
    return jsonify(_serialize_timesheet(ts))