import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Predict from './pages/Predict';
import Leaderboard from './pages/Leaderboard';
import History from './pages/History';
import Admin from './pages/Admin';
import ViewPredictions from './pages/ViewPredictions';

function App() {
  return (
    <UserProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict/:raceId" element={<Predict />} />
            <Route path="/predictions" element={<ViewPredictions />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </Router>
    </UserProvider>
  );
}

export default App;
