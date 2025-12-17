from datetime import datetime

from src.models.equipment import db


class Timesheet(db.Model):
    __tablename__ = "timesheets"

    timesheet_id = db.Column(db.Integer, primary_key=True)

    equipment_id = db.Column(
        db.Integer, db.ForeignKey("equipment.equipment_id"), nullable=False
    )
    driver_id = db.Column(
        db.Integer, db.ForeignKey("drivers.driver_id"), nullable=False
    )

    # month_year: first day of the month this card covers
    month_year = db.Column(db.Date, nullable=False)

    # Header fields for the card
    project_location = db.Column(db.String(255), nullable=False, default="HAYA AL ANDLUS")
    supplier_name = db.Column(db.String(255), nullable=True)
    chassis_no = db.Column(db.String(255), nullable=True)
    start_meter = db.Column(db.Numeric(10, 1), nullable=True)
    end_meter = db.Column(db.Numeric(10, 1), nullable=True)

    diesel_consumption_ltrs = db.Column(db.Numeric(10, 2), nullable=True)

    status = db.Column(
        db.String(32),
        nullable=False,
        default="draft",
    )  # 'draft','submitted','approved','rejected'

    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    equipment = db.relationship("Equipment", backref="timesheets")
    driver = db.relationship("Driver", backref="timesheets")
    days = db.relationship(
        "TimesheetDay",
        backref="timesheet",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class TimesheetDay(db.Model):
    __tablename__ = "timesheet_days"

    day_id = db.Column(db.Integer, primary_key=True)
    timesheet_id = db.Column(
        db.Integer, db.ForeignKey("timesheets.timesheet_id"), nullable=False
    )

    log_date = db.Column(db.Date, nullable=False)

    time_start = db.Column(db.Time, nullable=True)
    time_end = db.Column(db.Time, nullable=True)
    duty_break_hrs = db.Column(db.Numeric(5, 2), nullable=False, default=1)

    regular_working_hrs = db.Column(db.Numeric(5, 2), nullable=True)
    overtime_hrs = db.Column(db.Numeric(5, 2), nullable=True)
    total_using_hrs = db.Column(db.Numeric(5, 2), nullable=True)

    breakdown_reason = db.Column(db.String(255), nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class TimesheetApproval(db.Model):
    __tablename__ = "timesheet_approvals"

    approval_id = db.Column(db.Integer, primary_key=True)
    timesheet_id = db.Column(
        db.Integer, db.ForeignKey("timesheets.timesheet_id"), nullable=False
    )

    level = db.Column(db.Integer, nullable=False)  # for future multi-level approvals
    role = db.Column(db.String(64), nullable=False)  # 'SiteEngineer', etc.

    approver_user_id = db.Column(
        db.Integer, db.ForeignKey("users.user_id"), nullable=False
    )

    status = db.Column(
        db.String(32),
        nullable=False,
        default="pending",
    )  # 'pending','approved','rejected'

    comment = db.Column(db.Text, nullable=True)
    acted_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )