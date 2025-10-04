import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Patients from './Patients';
import PatientDetail from './PatientDetail';
import Visits from './Visits';
import LabWork from './LabWork';
import Options from './Options';
import LayoutShell from '../ui/LayoutShell';

export default function App() {
  return (
    <LayoutShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/patients" element={<Patients />} />
  <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/visits" element={<Visits />} />
        <Route path="/lab-work" element={<LabWork />} />
        <Route path="/options" element={<Options />} />
        <Route path="*" element={<div className="p-6">Not Found</div>} />
      </Routes>
    </LayoutShell>
  );
}
