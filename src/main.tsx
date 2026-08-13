import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// autoUpdate: a new build takes over on the next navigation. There is no
// unsaved state to lose — everything already lives in localStorage.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
