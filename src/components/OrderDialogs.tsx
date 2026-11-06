import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  ChefHat,
  Pizza as PizzaIcon,
  Users,
} from 'lucide-react';
import type { Results } from '../../shared/ballots.ts';
import { MAX_SAVORY_PIZZAS, MAX_SWEET_PIZZAS } from '../../shared/ballots.ts';
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

function ResultsDialog({ results, error, onClose, onRefresh }: ResultsDialogProps) {
  const highestQuantity = Math.max(1, ...results.pizzas.map((pizza) => pizza.quantity));

  return (
    <Dialog title="Placar do time" onClose={onClose}>
      <span className="eyebrow">DEMOCRACIA COM BORDA RECHEADA</span>
      <h3>
        O time está com fome<span>.</span>
      </h3>
      <div className="result-summary">
        <span>
          <Users size={17} /> {results.participants} pessoas
        </span>
        <span>
          <PizzaIcon size={17} /> {results.slices} pizzas
        </span>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
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
                <small>pizzas</small>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="ranking-note">Contagem em sabores. Atualização a cada 15 segundos.</p>
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
