import { ArrowRight, CheckCheck, ChefHat, CircleAlert, Flame, LoaderCircle, Pizza as PizzaIcon, ShoppingBag, Users, X } from 'lucide-react';
import { MAX_SLICES } from '../../shared/ballots.ts';
import type { PizzaOrder } from '../hooks/usePizzaOrder.ts';

type OrderPanelProps = Pick<PizzaOrder,
  'ballot' | 'saved' | 'count' | 'dirty' | 'loading' | 'saving' | 'error' | 'results' | 'resultsError'
  | 'remove' | 'submit' | 'reconnect' | 'openResults'>;

const slots = Array.from({ length: MAX_SLICES }, (_, index) => index + 1);

export function OrderPanel({ ballot, saved, count, dirty, loading, saving, error, results, resultsError, remove, submit, reconnect, openResults }: OrderPanelProps) {
  return <aside className="order-panel" id="meu-pedido">
    <div className="order-top"><span className="eyebrow">RESERVADO PARA VOCÊ</span><ShoppingBag size={21} /></div><h2>Seu pedido<span>.</span></h2><p className="order-subtitle">Grandes ideias começam com pizza.</p>
    <div className="slice-slots" aria-label={`${count} de ${MAX_SLICES} pedaços selecionados`}>{slots.map(slot => <div key={slot} className={slot <= count ? 'filled' : ''}><PizzaIcon size={28} strokeWidth={1.5} /><span>0{slot}</span></div>)}</div>
    <div className="slice-status"><strong>{count} de {MAX_SLICES} pedaços</strong><span>{count === MAX_SLICES ? 'O trio perfeito!' : `Faltam ${MAX_SLICES - count} para a felicidade`}</span></div>
    <div className="receipt-items">{!ballot.length ? <div className="empty-order"><ChefHat size={34} strokeWidth={1.2} /><p>Sua fome tem bom gosto.<br />Só falta escolher.</p></div> : ballot.map(pizza => <div className="receipt-item" key={pizza.name}><span className="receipt-quantity">{pizza.quantity}×</span><strong>{pizza.name}</strong><button className="icon-button" aria-label={`Retirar ${pizza.name} do pedido`} title="Retirar sabor" disabled={loading || saving} onClick={() => remove(pizza.name)}><X size={15} /></button></div>)}</div>
    <div className="receipt-total"><span>Total de felicidade</span><strong>{count} {count === 1 ? 'pedaço' : 'pedaços'}</strong></div>
    <button className={`submit-button ${!dirty && saved.length ? 'is-saved' : ''}`} disabled={loading || saving || !dirty} onClick={() => void submit()}>{saving ? <><LoaderCircle size={18} className="spin" /> Enviando ao forno...</> : !dirty && saved.length ? <><CheckCheck size={18} /> Pedido confirmado</> : <>{!count && saved.length ? 'Cancelar meu pedido' : saved.length ? 'Atualizar meu pedido' : 'Confirmar meu pedido'}<ArrowRight size={18} /></>}</button>
    <p className="save-note">{dirty ? 'Escolhas ainda não enviadas.' : saved.length ? 'Salvo! Pode mudar de ideia por aqui.' : `Até ${MAX_SLICES} pedaços por pessoa. Sem reuniões extras.`}</p>
    {!!error && <div className="error-message" role="alert"><CircleAlert size={18} /><span>{error}<button onClick={reconnect}>Reconectar</button></span></div>}
    <div className="team-preview"><div className="team-preview-heading"><span className="live-dot" /><strong>A fome é coletiva</strong><Users size={17} /></div><div className="team-stats"><div><strong>{results.participants}</strong><span>pessoas no rolê</span></div><div><strong>{results.slices}</strong><span>pedaços votados</span></div></div><button className="text-button" onClick={openResults}>Ver o placar do time <ArrowRight size={15} /></button>{resultsError && <p className="small-error" role="status">{resultsError}</p>}</div>
    <div className="pizza-quote"><Flame size={18} /><p>“A união faz a força.<br />A pizza faz a união.”</p></div>
  </aside>;
}