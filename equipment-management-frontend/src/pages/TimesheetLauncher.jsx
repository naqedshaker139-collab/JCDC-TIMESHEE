import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // axios instance with baseURL '/api'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TimesheetLauncher() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [equipmentId, setEquipmentId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [monthYear, setMonthYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);

useEffect(() => {
  async function loadOptions() {
    try {
      setError("");
      setLoadingOptions(true);
      const [eqRes, drRes] = await Promise.all([
        api.get("/equipment"),
        api.get("/drivers"),
      ]);
      setEquipment(eqRes.data || []);
      setDrivers(drRes.data || []);
    } catch (e) {
      console.error("Failed to load equipment or drivers:", e);
      const code = e?.code || e?.response?.status;
      if (code === "ECONNABORTED") {
        setError("Server is waking up. Please wait a bit and try again.");
      } else {
        setError("Failed to load equipment or drivers.");
      }
    } finally {
      setLoadingOptions(false);
    }
  }
  loadOptions();
}, []);

  async function handleCreate() {
    if (!equipmentId || !driverId || !monthYear) {
      setError("Please select equipment, driver and month.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const monthDate = monthYear + "-01"; // e.g. 2025-08 -> 2025-08-01
      const res = await api.post("/timesheets", {
        equipment_id: Number(equipmentId),
        driver_id: Number(driverId),
        month_year: monthDate,
      });
      const ts = res.data;
      navigate(`/timesheets/${ts.timesheet_id}`);
    } catch (e) {
      console.error("Failed to create timesheet:", e);
      setError(e?.response?.data?.error || "Failed to create timesheet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Create Equipment Time Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            {loadingOptions ? (
              <div className="text-xs text-slate-500 py-4">
                Loading equipment and drivers…
              </div>
            ) : (
              <>
                {/* Equipment */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Equipment
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white"
                    value={equipmentId}
                    onChange={(e) => setEquipmentId(e.target.value)}
                  >
                    <option value="">Select equipment…</option>
                    {equipment.map((e) => (
                      <option key={e.equipment_id} value={e.equipment_id}>
                        {e.equipment_name} ({e.plate_serial_no})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Driver / Operator
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded px-2 py-2 text-sm bg-white"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                  >
                    <option value="">Select driver…</option>
                    {drivers.map((d) => (
                      <option key={d.driver_id} value={d.driver_id}>
                        {d.driver_name} ({d.eqama_number})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Month
                  </label>
                  <Input
                    type="month"
                    value={monthYear}
                    onChange={(e) => setMonthYear(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleCreate}
              disabled={busy || loadingOptions}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create Time Card"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}