import { Routes, Route, Navigate } from 'react-router-dom';
import Chat from './Chat';
import Conversation from './Conversation';
import LoginPage from './auth/LoginPage';
import SignupPage from './auth/SignupPage';
import ConfirmEmail from './auth/ConfirmEmail';
import { UserInfoInput } from './auth/UserInfoInput';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Chat" replace />} />
      <Route path="/Chat" element={<Chat />} />
      <Route path="/Conversation" element={<Conversation />} />
      <Route path="/auth/LoginPage" element={<LoginPage />} />
      <Route path="/auth/SignupPage" element={<SignupPage />} />
      <Route path="/auth/ConfirmEmail" element={<ConfirmEmail />} />
      <Route path="/auth/UserInfoInput" element={<UserInfoInput />} />
    </Routes>
  );
}

export default App;
