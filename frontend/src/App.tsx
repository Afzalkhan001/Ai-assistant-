import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChatScreen from './screens/ChatScreen';
import TasksScreen from './screens/TasksScreen';
import CheckinScreen from './screens/CheckinScreen';
import ReflectionsScreen from './screens/ReflectionsScreen';
import SettingsScreen from './screens/SettingsScreen';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatScreen />} />
          <Route path="tasks" element={<TasksScreen />} />
          <Route path="checkin" element={<CheckinScreen />} />
          <Route path="reflections" element={<ReflectionsScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
