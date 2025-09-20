import { Routes, Route, Navigate } from 'react-router-dom';
import Chat from './chat/Chat';
import Conversation from './chat/Conversation';
import LoginPage from './authentication/LoginPage';
import SignupPage from './authentication/SignupPage';
import { UserInfoInput } from './authentication/UserInfoInput';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="./chat/Chat" replace />} />
      <Route path="/chat/Chat" element={<Chat />} />
      <Route path="/chat/Conversation" element={<Conversation />} />
      <Route path="/authentication/LoginPage" element={<LoginPage />} />
      <Route path="/authentication/SignupPage" element={<SignupPage />} />
      <Route path="/authentication/UserInfoInput" element={<UserInfoInput />} />
    </Routes>
  );
}

export default App;
