import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BenchmarkDetail from './pages/BenchmarkDetail';
import SubmitBenchmark from './pages/SubmitBenchmark';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import HardwareBrowse from './pages/HardwareBrowse';
import HardwareDetail from './pages/HardwareDetail';
import HardwareCompare from './pages/HardwareCompare';
import PublicProfile from './pages/PublicProfile';
import Badges from './pages/Badges';
import CommunityFeed from './pages/CommunityFeed';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import CollectionEditor from './pages/CollectionEditor';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Navigate to="/hardware" replace />} />
        <Route path="benchmarks/:id" element={<BenchmarkDetail />} />
        <Route path="leaderboard" element={<Navigate to="/hardware" replace />} />
        <Route path="compare" element={<Navigate to="/hardware/compare" replace />} />
        <Route path="hardware" element={<HardwareBrowse />} />
        <Route path="hardware/compare" element={<HardwareCompare />} />
        <Route path="hardware/:id" element={<HardwareDetail />} />
        <Route path="community" element={<CommunityFeed />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/:id" element={<CollectionDetail />} />
        <Route path="u/:username" element={<PublicProfile />} />
        <Route path="badges" element={<Badges />} />
        <Route
          path="collections/new"
          element={(
            <ProtectedRoute>
              <CollectionEditor />
            </ProtectedRoute>
          )}
        />
        <Route
          path="collections/:id/edit"
          element={(
            <ProtectedRoute>
              <CollectionEditor />
            </ProtectedRoute>
          )}
        />

        <Route path="submit" element={
          <ProtectedRoute>
            <SubmitBenchmark />
          </ProtectedRoute>
        } />
        
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="admin" element={
          <ProtectedRoute adminOnly>
            <Admin />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}
