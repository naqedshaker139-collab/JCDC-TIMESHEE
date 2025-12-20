import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

function formatDateLabel(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  }); // 1 Aug
}

function formatMonthRange(monthYear) {
  if (!monthYear) return "";
  const d = new Date(monthYear);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const fmt = (dt) =>
    dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return `${fmt(first)} – ${fmt(last)} ${year}`;
}

export default function TimesheetCard() {
  const { id } = useParams(); // /timesheets/:id
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const timesheet = data;

  const summary = useMemo(() => {
    if (!timesheet?.days) return { days: 0, regular: 0, ot: 0, total: 0 };
    const validDays = timesheet.days.filter(
      (d) => d.time_start && d.time_end && d.total_using_hrs != null
    );
    let days = validDays.length;
    let regular = 0;
    let ot = 0;
    let total = 0;
    for (const d of validDays) {
      regular += d.regular_working_hrs || 0;
      ot += d.overtime_hrs || 0;
      total += d.total_using_hrs || 0;
    }
    return {
      days,
      regular: Number(regular.toFixed(2)),
      ot: Number(ot.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [timesheet]);

  const isSubmitted = timesheet?.status === "submitted";
  const isApproved = timesheet?.status === "approved";

  async function fetchTimesheet() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/timesheets/${id}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError("Failed to load timesheet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTimesheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleClockIn() {
    if (!timesheet) return;
    setBusy(true);
    setError("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api.post(`/timesheets/${timesheet.timesheet_id}/clock-in`, {
        log_date: today,
      });
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Clock-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClockOut() {
    if (!timesheet) return;
    setBusy(true);
    setError("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api.post(
        `/timesheets/${timesheet.timesheet_id}/clock-out`,
        { log_date: today }
      );
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Clock-out failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateDay(dayId, patch) {
    setBusy(true);
    setError("");
    try {
      const res = await api.patch(`/timesheets/days/${dayId}`, patch);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!timesheet) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/timesheets/${timesheet.timesheet_id}/submit`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Submit failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    if (!timesheet) return;
    const comment = window.prompt("Approval comment (optional):") || "";
    setBusy(true);
    setError("");
    try {
      const res = await api.post(
        `/timesheets/${timesheet.timesheet_id}/approve`,
        { comment }
      );
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Approval failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-700 text-sm">Loading timesheet…</div>
      </div>
    );
  }

  if (!timesheet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-red-600 text-sm">
          Failed to load timesheet.{" "}
          <button
            className="underline"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-slate-100 p-4 md:p-8">
    <div className="max-w-5xl mx-auto bg-white shadow border border-slate-200 p-4 md:p-6 timesheet-print-page">
        {/* Top header / logos */}
        <div className="flex flex-col items-center border-b border-slate-300 pb-4 mb-4">
          <div className="text-[10px] text-center font-semibold text-slate-600 uppercase tracking-wide">
            Stadium and Surrounding Village
          </div>
          <div className="text-[10px] text-center text-slate-500">
            Obhor Jeddah Central Development Company (JCDC) – CRCC & SAMA
          </div>
          <div className="mt-2 text-xs font-semibold text-red-700 uppercase">
            Machinery / Plant / Vehicle Division
          </div>
          <div className="mt-2 px-4 py-1 border border-slate-400 bg-yellow-50 text-xs font-bold text-slate-800 uppercase">
            Equipment Time Card
          </div>
          <div className="mt-1 text-[11px] text-slate-600">
            Month:&nbsp;
            <span className="font-semibold">
              {formatMonthRange(timesheet.month_year)}
            </span>
          </div>
        </div>

        {/* Header fields */}
        <div className="border border-slate-300 mb-4 text-[11px]">
          <div className="grid grid-cols-2 border-b border-slate-300">
            <div className="flex border-r border-slate-300">
              <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Equipment / Vehicle Name
              </div>
              <div className="flex-1 px-2 py-1">
                {timesheet.equipment.equipment_name}
              </div>
            </div>
            <div className="flex">
              <div className="w-32 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Project Location
              </div>
              <div className="flex-1 px-2 py-1">
                {timesheet.project_location}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-slate-300">
            <div className="flex border-r border-slate-300">
              <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Supplier name
              </div>
              <div className="flex-1 px-2 py-1">
                {timesheet.supplier_name || "—"}
              </div>
            </div>
            <div className="flex">
              <div className="w-32 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Operator Name
              </div>
              <div className="flex-1 px-2 py-1">
                {timesheet.driver.driver_name}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-slate-300">
            <div className="flex border-r border-slate-300">
              <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Operator IQAMA NO.
              </div>
              <div className="flex-1 px-2 py-1">
                {timesheet.driver.eqama_number}
              </div>
            </div>
            <div className="flex">
              <div className="w-32 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Operator PHONE NO.
              </div>
              <div className="flex-1 px-2 py-1">
                {timesheet.driver.phone_number}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="flex border-r border-slate-300">
              <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                CHASSIS NO
              </div>
              <div className="flex-1 px-2 py-1">
                {timesheet.chassis_no || "—"}
              </div>
            </div>
            <div className="flex">
              <div className="w-32 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Start &amp; End Km / Hrs
              </div>
              <div className="flex-1 px-2 py-1">
                {timesheet.start_meter ?? ""}{" "}
                {timesheet.start_meter != null ? "–" : ""}
                {" "}
                {timesheet.end_meter ?? ""}
              </div>
            </div>
          </div>
        </div>

       {/* clock controls and status */}
<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
  <div className="flex flex-col gap-1">
    <div className="flex gap-2">
      <button
        onClick={handleClockIn}
        disabled={busy || isSubmitted || isApproved}
        className="px-4 py-2 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        Clock In (Today)
      </button>
      <button
        onClick={handleClockOut}
        disabled={busy || isSubmitted || isApproved}
        className="px-4 py-2 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        Clock Out (Today)
      </button>
    </div>
    <div className="text-[10px] text-slate-500">
      Note: For past days, type the start/end times directly in the table below.
      Clock buttons are only a shortcut for today.
    </div>
  </div>
  <div className="text-xs text-slate-600">
    Status:&nbsp;
    <span
      className={
        isApproved
          ? "font-semibold text-green-700"
          : isSubmitted
          ? "font-semibold text-amber-700"
          : "font-semibold text-slate-700"
      }
    >
      {timesheet.status}
    </span>
  </div>
</div>

        {/* Daily grid */}
        <div className="border border-slate-300 text-[11px] overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-amber-100">
                <th className="border border-slate-300 px-1 py-1 text-left w-20">
                  Date
                </th>
                <th className="border border-slate-300 px-1 py-1 text-center w-20">
                  Time Start
                </th>
                <th className="border border-slate-300 px-1 py-1 text-center w-20">
                  Time End
                </th>
                <th className="border border-slate-300 px-1 py-1 text-center w-20">
                  Duty Break Hrs
                </th>
                <th className="border border-slate-300 px-1 py-1 text-center w-24">
                  Regular Working Hr
                </th>
                <th className="border border-slate-300 px-1 py-1 text-center w-20">
                  Over Time Hr
                </th>
                <th className="border border-slate-300 px-1 py-1 text-center w-24">
                  Total Using Hrs.
                </th>
                <th className="border border-slate-300 px-1 py-1 text-left">
                  Break Down
                </th>
              </tr>
            </thead>
            <tbody>
              {timesheet.days.map((d) => {
                const disabled = isApproved;
                return (
                  <tr key={d.day_id} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-200 px-1 py-1">
                      {formatDateLabel(d.log_date)}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      <input
                        type="time"
                        className="border border-slate-300 text-[11px] px-1 py-0.5 rounded w-24"
                        disabled={disabled}
                        value={d.time_start ? d.time_start.slice(0, 5) : ""}
                        onChange={(e) =>
                          handleUpdateDay(d.day_id, {
                            time_start: e.target.value || null,
                          })
                        }
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      <input
                        type="time"
                        className="border border-slate-300 text-[11px] px-1 py-0.5 rounded w-24"
                        disabled={disabled}
                        value={d.time_end ? d.time_end.slice(0, 5) : ""}
                        onChange={(e) =>
                          handleUpdateDay(d.day_id, {
                            time_end: e.target.value || null,
                          })
                        }
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        className="border border-slate-300 text-[11px] px-1 py-0.5 rounded w-20 text-right"
                        disabled={disabled}
                        value={d.duty_break_hrs}
                        onChange={(e) =>
                          handleUpdateDay(d.day_id, {
                            duty_break_hrs: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      {d.regular_working_hrs != null
                        ? d.regular_working_hrs
                        : ""}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      {d.overtime_hrs != null ? d.overtime_hrs : ""}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      {d.total_using_hrs != null ? d.total_using_hrs : ""}
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <input
                        type="text"
                        className="border border-slate-300 text-[11px] px-1 py-0.5 rounded w-full"
                        disabled={disabled}
                        value={d.breakdown_reason || ""}
                        onChange={(e) =>
                          handleUpdateDay(d.day_id, {
                            breakdown_reason: e.target.value,
                          })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary row */}
        <div className="mt-3 border border-slate-300 text-[11px]">
          <div className="flex border-b border-slate-300">
            <div className="flex-1 flex border-r border-slate-300">
              <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Total Working Days
              </div>
              <div className="flex-1 px-2 py-1">{summary.days} Days</div>
            </div>
            <div className="flex-1 flex">
              <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Regular working Hours
              </div>
              <div className="flex-1 px-2 py-1">
                {summary.regular} Hours
              </div>
            </div>
          </div>
          <div className="flex border-b border-slate-300">
            <div className="flex-1 flex border-r border-slate-300">
              <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Over time Hours
              </div>
              <div className="flex-1 px-2 py-1">
                {summary.ot} Hours
              </div>
            </div>
            <div className="flex-1 flex">
              <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
                Total working Hours
              </div>
              <div className="flex-1 px-2 py-1">
                {summary.total} Hours
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="w-40 bg-amber-100 border-r border-slate-300 px-2 py-1 font-semibold">
              DIESELE CONSUMPTION
            </div>
            <div className="flex-1 px-2 py-1">
              {timesheet.diesel_consumption_ltrs ?? ""} Ltrs
            </div>
          </div>
        </div>

        {/* Footer approvals */}
        <div className="mt-4 border border-slate-300 text-[11px]">
          <div className="grid grid-cols-4 divide-x divide-slate-300">
            <div className="px-2 py-3 text-center">
              <div className="font-semibold mb-1 text-slate-700">
                Checker
              </div>
              <div className="text-slate-400">—</div>
            </div>
            <div className="px-2 py-3 text-center">
              <div className="font-semibold mb-1 text-slate-700">
                Site Engineer
              </div>
              {timesheet.approval?.status === "approved" ? (
                <div className="text-green-700 font-semibold">
                  Approved
                </div>
              ) : (
                <div className="flex flex-col gap-1 items-center">
                  <div className="text-slate-500 mb-1">
                    Status: {timesheet.approval?.status || "—"}
                  </div>
                  <button
                    onClick={handleApprove}
                    disabled={busy || isApproved || !isSubmitted}
                    className="px-3 py-1 text-[11px] rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
            <div className="px-2 py-3 text-center">
              <div className="font-semibold mb-1 text-slate-700">
                Head Of Dept.
              </div>
              <div className="text-slate-400 text-[10px]">
                
              </div>
            </div>
            <div className="px-2 py-3 text-center">
              <div className="font-semibold mb-1 text-slate-700">
                PMV Manager / Project Manager
              </div>
              <div className="text-slate-400 text-[10px]">
                
              </div>
            </div>
          </div>
        </div>

        {/* Bottom controls and errors */}
        <div className="mt-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={busy || isSubmitted || isApproved}
              className="px-4 py-2 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Submit Timesheet
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Print
            </button>
          </div>
          {error && (
            <div className="text-xs text-red-600 max-w-md">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}