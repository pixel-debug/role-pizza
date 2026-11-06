import { useState } from 'react';
import { Check, Leaf, Minus, Plus } from 'lucide-react';
import type { Pizza } from '../menu.ts';
import type { QuantityDelta } from '../hooks/usePizzaOrder.ts';

interface PizzaCardProps {
  pizza: Pizza;
  quantity: number;
  onChange: (name: string, delta: QuantityDelta) => void;
  disabled: boolean;
}

export function PizzaCard({ pizza, quantity, onChange, disabled }: PizzaCardProps) {
  const [expanded, setExpanded] = useState(false);

  return <article className={`pizza-card ${quantity ? 'selected' : ''}`}>
    <div className="pizza-photo"><img src={pizza.image} alt={pizza.imageIsIllustrative ? `Imagem ilustrativa; É foto da pizza ${pizza.name}` : `Pizza ${pizza.name}`} loading="lazy" decoding="async" onError={event => { event.currentTarget.style.display = 'none'; }} />
      {pizza.imageIsIllustrative && <span className="photo-credit">Imagem ilustrativa, É a foto da pizza</span>}
      {quantity > 0 && <span className="selected-count"><Check size={13} /> {quantity} {quantity === 1 ? 'pedaço' : 'pedaços'}</span>}
    </div>
    <div className="card-content"><div className="card-label">{pizza.category}{pizza.vegetarian && <span title="Sem carne ou peixe; contém ingredientes de origem animal"><Leaf size={13} /> Vegetariana</span>}</div>
      <h3>{pizza.name}</h3>
      <p className={expanded ? 'description expanded' : 'description'}>{pizza.description}</p>
      <button className="text-button details" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Menos detalhes' : 'Ver ingredientes'} <Plus size={12} /></button>
      <div className="card-bottom"><span>Vai um pedaço?</span><div className="stepper"><button aria-label={`Remover pedaço de ${pizza.name}`} title="Remover pedaço" disabled={!quantity || disabled} onClick={() => onChange(pizza.name, -1)}><Minus size={16} /></button><output aria-label={`Quantidade de ${pizza.name}`}>{quantity}</output><button aria-label={`Adicionar pedaço de ${pizza.name}`} title="Adicionar pedaço" disabled={disabled} onClick={() => onChange(pizza.name, 1)}><Plus size={16} /></button></div></div>
    </div>
  </article>;
}
