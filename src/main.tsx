import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz da aplicacao nao encontrado.');

createRoot(root).render(<App />);