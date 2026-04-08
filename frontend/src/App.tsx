import { Routes, Route, Navigate } from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { UnitPage } from './pages/UnitPage';
import { UnitDetailedPage } from './pages/UnitDetailedPage';
import { QuizPage } from './pages/QuizPage';
import { StudentShell } from './components/StudentShell';
import { AdminLayout } from './components/AdminLayout';
import { AdminRoute } from './components/AdminRoute';
import { CertificatePage } from './pages/CertificatePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { StudentInboxPage } from './pages/StudentInboxPage';
import { PeerDiscussionPage } from './pages/PeerDiscussionPage';
import { PrivateMessagesPage } from './pages/PrivateMessagesPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
      </Route>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <StudentShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="certificate" element={<CertificatePage />} />
        <Route path="inbox" element={<StudentInboxPage />} />
        <Route path="private-messages" element={<PrivateMessagesPage />} />
        <Route path="peer-discussion" element={<PeerDiscussionPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:slug" element={<CourseDetailPage />} />
        <Route path="courses/:slug/units/:unitNumber" element={<UnitPage />} />
        <Route
          path="courses/:slug/units/:unitNumber/detailed"
          element={<UnitDetailedPage />}
        />
        <Route path="courses/:slug/units/:unitNumber/quiz" element={<QuizPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
