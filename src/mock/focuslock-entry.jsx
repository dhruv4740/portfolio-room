import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import FocuslockPage from './FocuslockPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FocuslockPage />
  </StrictMode>,
);
