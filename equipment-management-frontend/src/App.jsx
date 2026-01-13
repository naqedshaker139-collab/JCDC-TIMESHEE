import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EquipmentList from './components/EquipmentList';
import DriverList from './components/DriverList';
import RequestForm from './components/RequestForm';
import RequestHistory from './components/RequestHistory';
import TimesheetLauncher from './pages/TimesheetLauncher';
import TimesheetCard from './pages/TimesheetCard';
import Login from './pages/Login'; // NEW
import './api'; // Configure axios
import './i18n';
import './App.css';

function App() {
  const { i18n } = useTranslation();
  
  // Set document direction based on language
  document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <Router>
      <Routes>
        {/* Public login route WITHOUT layout */}
        <Route path="/login" element={<Login />} />

        {/* All other routes WITH main layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/equipment" element={<EquipmentList />} />
                <Route path="/drivers" element={<DriverList />} />
                <Route path="/request" element={<RequestForm />} />
                <Route path="/requests" element={<RequestHistory />} />
                <Route path="/timesheets/new" element={<TimesheetLauncher />} />
                <Route path="/timesheets/:id" element={<TimesheetCard />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;