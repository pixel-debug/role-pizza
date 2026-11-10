import { useState } from 'react';
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  ChefHat,
  Pizza as PizzaIcon,
  Users,
} from 'lucide-react';
import type { Results } from '../../shared/ballots.ts';
import { EVENT_PARTICIPANTS, MAX_SAVORY_PIZZAS, MAX_SWEET_PIZZAS } from '../../shared/ballots.ts';
import {
  createPizzaPlan,
  SAVORY_SLICES_PER_PERSON,
  SLICES_PER_HALF,
  SLICES_PER_PERSON,
  SLICES_PER_PIZZA,
  SWEET_SLICES_PER_PERSON,
} from '../services/pizza-planner.ts';
import type { OrderModal } from '../hooks/usePizzaOrder.ts';
import { Dialog } from './Dialog.tsx';

interface OrderDialogsProps {
  modal: OrderModal;
  results: Results;
  resultsError: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

interface ResultsDialogProps {
  results: Results;
  error: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

function formatPizzaAmount(halves: number): string {
  const wholePizzas = Math.floor(halves / 2);
  if (halves % 2) return wholePizzas ? `${wholePizzas}½ pizzas` : '½ pizza';
  return `${wholePizzas} ${wholePizzas === 1 ? 'pizza' : 'pizzas'}`;
}

function ResultsDialog({ results, error, onClose, onRefresh }: ResultsDialogProps) {
  const [activeTab, setActiveTab] = useState<'ranking' | 'plan'>('ranking');
  const highestQuantity = Math.max(1, ...results.pizzas.map((pizza) => pizza.quantity));
  const plan = createPizzaPlan(results);
  const highestHalves = Math.max(1, ...plan.flavors.map(flavor => flavor.halves));

  return (
    <Dialog title="Placar do time" onClose={onClose} className="results-dialog">
      <span className="eyebrow">DEMOCRACIA COM BORDA RECHEADA</span>
      <h3>
        O time está com fome<span>.</span>
      </h3>
      <div className="result-summary">
        <span>
          <Users size={17} /> {results.participants} de {EVENT_PARTICIPANTS} pessoas votaram
        </span>
        <span>
          <PizzaIcon size={17} /> {results.slices} votos
        </span>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <div className="results-tabs" role="tablist" aria-label="Visualização do placar">
        <button id="ranking-tab" role="tab" aria-selected={activeTab === 'ranking'} aria-controls="ranking-panel" className={activeTab === 'ranking' ? 'active' : ''} onClick={() => setActiveTab('ranking')}>
          <ChartNoAxesColumnIncreasing size={15} /> Placar de votos
        </button>
        <button id="plan-tab" role="tab" aria-selected={activeTab === 'plan'} aria-controls="plan-panel" className={activeTab === 'plan' ? 'active' : ''} onClick={() => setActiveTab('plan')}>
          <PizzaIcon size={15} /> Sugestão de pedido
        </button>
      </div>
      {activeTab === 'ranking' ? (
        <section id="ranking-panel" role="tabpanel" aria-labelledby="ranking-tab">
          {!results.pizzas.length ? (
            <div className="empty-order">
              <ChefHat size={40} />
              <p>O placar está esperando a primeira fatia.</p>
            </div>
          ) : (
            <ol className="ranking">
              {results.pizzas.map((pizza, index) => (
                <li key={pizza.name}>
                  <span className="rank-position">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{pizza.name}</strong>
                    <div className="rank-track">
                      <span style={{ width: `${(pizza.quantity / highestQuantity) * 100}%` }} />
                    </div>
                  </div>
                  <span className="rank-count">
                    {pizza.quantity}
                    <small>votos</small>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="ranking-note">Preferências por sabor. Atualização a cada 15 segundos.</p>
        </section>
      ) : (
        <section id="plan-panel" role="tabpanel" aria-labelledby="plan-tab" className="plan-panel">
          <div className="plan-overview">
            <div className="plan-overview-heading"><PizzaIcon size={18} /> Estimativa de compra</div>
            <div className="estimate-values">
              <div><strong>{plan.pizzas.length}</strong><span>{plan.pizzas.length === 1 ? 'pizza inteira' : 'pizzas inteiras'}</span></div>
              <div><strong>{plan.totalSlices}</strong><span>fatias no pedido</span></div>
            </div>
            <p><strong>{plan.savoryPizzas} salgadas · {plan.sweetPizzas} doces</strong></p>
            <p>Estimativa de {SLICES_PER_PERSON} fatias por pessoa que votou ({SAVORY_SLICES_PER_PERSON} salgadas + {SWEET_SLICES_PER_PERSON} doce como referência): {plan.requestedSlices} fatias estimadas, arredondadas para pizzas inteiras de {SLICES_PER_PIZZA} fatias.</p>
            <p>{results.participants} de {EVENT_PARTICIPANTS} pessoas votaram. A quantidade considera somente quem já votou; os sabores consideram os votos recebidos até o momento. Categorias sem votos ficam fora do pedido.</p>
            {results.participants < EVENT_PARTICIPANTS && (
              <p role="status">Há votos pendentes: a quantidade e os sabores ainda podem mudar. Atualização automática a cada 15 segundos.</p>
            )}
            <p>Cada pizza tem duas metades de {SLICES_PER_HALF} fatias. Sabores doces e salgados não se misturam.</p>
          </div>
          {!plan.flavors.length ? (
            <div className="empty-order"><ChefHat size={40} /><p>Nenhum voto recebido. A sugestão será calculada quando alguém votar.</p></div>
          ) : (
            <>
              <h4 className="plan-section-title">Por sabor</h4>
              <ol className="flavor-plan">
                {plan.flavors.map(flavor => (
                  <li key={flavor.name}>
                    <div className="flavor-plan-label"><strong>{flavor.name}</strong><span>{flavor.votes} {flavor.votes === 1 ? 'voto recebido' : 'votos recebidos'}</span></div>
                    <div className="flavor-plan-track"><span style={{ width: `${(flavor.halves / highestHalves) * 100}%` }} /></div>
                    <small>Sugestão: {formatPizzaAmount(flavor.halves)} · {flavor.halves} {flavor.halves === 1 ? 'metade' : 'metades'}</small>
                  </li>
                ))}
              </ol>
              <h4 className="plan-section-title">Como montar</h4>
              <ol className="pizza-combinations">
                {plan.pizzas.map((pizza, index) => (
                  <li key={`${pizza.category}-${index}`}>
                    <span className="combination-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="combination-half">{pizza.firstFlavor}</span>
                    <span className="combination-divider" aria-label="metade">½</span>
                    <span className="combination-half">{pizza.secondFlavor}</span>
                    <small>{pizza.category}</small>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}
      <button className="secondary-button full-width" onClick={() => void onRefresh()}>
        <ChartNoAxesColumnIncreasing size={17} /> Atualizar placar
      </button>
    </Dialog>
  );
}

export function OrderDialogs({
  modal,
  results,
  resultsError,
  onClose,
  onRefresh,
}: OrderDialogsProps) {
  if (!modal) return null;
  if (modal === 'results')
    return (
      <ResultsDialog
        results={results}
        error={resultsError}
        onClose={onClose}
        onRefresh={onRefresh}
      />
    );
  const welcome = modal === 'welcome';

  return (
    <Dialog
      title={welcome ? `${MAX_SAVORY_PIZZAS} salgadas + ${MAX_SWEET_PIZZAS} doce` : 'Limite do pedido atingido'}
      onClose={onClose}
    >
      <div className="modal-art">
        <PizzaIcon size={54} strokeWidth={1.3} />
        <span>
          +<span></span>
        </span>
        <PizzaIcon size={54} strokeWidth={1.3} />
       <span>
          +<span></span>
        </span>
        <PizzaIcon size={54} strokeWidth={1.3} />
        <span>
          +<span></span>
        </span>
        <PizzaIcon size={54} strokeWidth={1.3} />
      </div>
      <span className="eyebrow">
        {welcome ? 'COMBINADO NÃO SAI CARO' : 'OPA, A AUDITORIA DA PIZZA CHEGOU'}
      </span>
      <h3>{welcome ? 'Salgada, salgada, salgada e uma doce. Infinitas opiniões' : 'Calma, calabreso!'}</h3>
      <p>
        {welcome
          ? `Aqui o limite é de ${MAX_SAVORY_PIZZAS} pizzas salgadas e ${MAX_SWEET_PIZZAS} doce. Pode misturar sabores, repetir o favorito e defender abacaxi em silêncio`
          : `Sua equipe também está com fome! O limite é de ${MAX_SAVORY_PIZZAS} pizzas salgadas e ${MAX_SWEET_PIZZAS} doce. Para trocar, remova uma pedaço da mesma categoria antes de adicionar outro.`}
      </p>
      <div className="modal-note">
        <Users size={18} /> Pizza para todo mundo. Treta só pelo último guardanapo.
      </div>
      <button className="submit-button" onClick={onClose}>
        {welcome ? 'Entendido. Cadê a pizza?' : 'Tá bom, vou compartilhar.'}
        <ArrowRight size={18} />
      </button>
    </Dialog>
  );
}
