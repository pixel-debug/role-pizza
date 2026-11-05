import { useState } from 'react';
import { Leaf, LoaderCircle, Search, Sparkles } from 'lucide-react';
import type { Ballot } from '../../shared/ballots.ts';
import type { QuantityDelta } from '../hooks/usePizzaOrder.ts';
import { menu, type Category } from '../menu.ts';
import { PizzaCard } from './PizzaCard.tsx';

type CategoryFilter = Category | 'Todas';
const categories: readonly CategoryFilter[] = ['Todas', 'Especiais', 'Clássicas', 'Doces'];

interface MenuSectionProps {
  ballot: Ballot;
  loading: boolean;
  disabled: boolean;
  onChange: (name: string, delta: QuantityDelta) => void;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function MenuSection({ ballot, loading, disabled, onChange }: MenuSectionProps) {
  const [category, setCategory] = useState<CategoryFilter>('Todas');
  const [search, setSearch] = useState('');
  const [vegetarian, setVegetarian] = useState(false);
  const query = normalize(search);
  const visible = menu.filter(pizza =>
    (category === 'Todas' || pizza.category === category)
    && (!vegetarian || pizza.vegetarian)
    && normalize(`${pizza.name} ${pizza.description}`).includes(query));

  function clearFilters(): void {
    setSearch('');
    setVegetarian(false);
    setCategory('Todas');
  }

  return <section className="menu-section" id="cardapio">
    <div className="section-heading"><div><span className="eyebrow">A PAUTA DE HOJE</span><h2>Qual é a sua fatia?</h2></div><span className="menu-count">{menu.length} sabores, zero decisões fáceis.</span></div>
    <div className="filter-row"><div className="tabs" role="group" aria-label="Categoria de pizza">{categories.map(item => <button key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item === 'Especiais' && <Sparkles size={14} />}{item}{item === 'Todas' && <span>{menu.length}</span>}</button>)}</div></div>
    <div className="search-row"><label className="search"><Search size={18} /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Busque um sabor ou ingrediente" aria-label="Buscar pizza ou ingrediente" /></label><label className="vegetarian-filter"><input type="checkbox" checked={vegetarian} onChange={event => setVegetarian(event.target.checked)} /><Leaf size={16} /> Só vegetarianas</label></div>
    <div className="menu-meta"><span>{visible.length} sabores na mesa</span><span>Fotos ilustrativas</span></div>
    {loading && <div className="loading-state" role="status"><LoaderCircle className="spin" /> Esquentando o forno...</div>}
    <div className="pizza-grid">{visible.map(pizza => <PizzaCard key={pizza.name} pizza={pizza} quantity={ballot.find(item => item.name === pizza.name)?.quantity ?? 0} onChange={onChange} disabled={disabled} />)}</div>
    {!visible.length && <div className="empty-search"><Search size={30} /><h3>Esse sabor saiu para almoçar.</h3><p>Tente outro ingrediente ou tire os filtros.</p><button className="secondary-button" onClick={clearFilters}>Limpar filtros</button></div>}
    <p className="menu-disclaimer">Ingredientes transcritos das imagens do cardápio. Fotos ilustrativas, não correspondem aos sabores. Restrições e alergênicos devem ser confirmados com a pizzaria.</p>
  </section>;
}