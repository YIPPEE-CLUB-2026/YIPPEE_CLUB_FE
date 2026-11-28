'use client';

import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { ChildrenProvider } from './context/ChildrenContext';
import { NavigationHistory } from './components/NavigationHistory';
import { ToastHost } from './components/Toast';
import { DesktopFrame } from './components/DesktopFrame';

export default function Application() {
  return (
    <BrowserRouter>
      <NavigationHistory />
      <AuthProvider>
        <ChildrenProvider>
          <DesktopFrame>
            <App />
            <ToastHost />
          </DesktopFrame>
        </ChildrenProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
