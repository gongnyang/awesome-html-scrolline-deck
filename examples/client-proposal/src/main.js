/**
 * main.js — the only file that knows about the bundler.
 * It collects the scene folders with import.meta.glob and hands them to the engine.
 * Do not add deck logic here; scene behaviour belongs in src/scenes/<id>/scene.js.
 */
import './tokens.css';
import './base.css';
import './engine/deck.css';
import deck from '../data/deck.json';
import { createDeck } from './engine/deck.js';

const modules = import.meta.glob('./scenes/*/scene.js', { eager: true });
const partials = import.meta.glob('./scenes/*/scene.html', { eager: true, query: '?raw', import: 'default' });
const styles = import.meta.glob('./scenes/*/scene.css', { eager: true });

createDeck({
  root: document.getElementById('deck'),
  deck,
  modules,
  partials,
  styles,
}).catch((err) => console.error('[scrolline] deck failed to start', err));
