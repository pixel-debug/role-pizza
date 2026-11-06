import {
  ArrowDown,
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  CheckCheck,
  Pizza as PizzaIcon,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { MAX_SAVORY_PIZZAS, MAX_SLICES, MAX_SWEET_PIZZAS } from '../shared/ballots.ts';
import { MenuSection } from './components/MenuSection.tsx';
import { OrderDialogs } from './components/OrderDialogs.tsx';
import { OrderPanel } from './components/OrderPanel.tsx';
import { usePizzaOrder } from './hooks/usePizzaOrder.ts';

export default function App() {
  const order = usePizzaOrder();

  return (
    <>
      <div className="announcement">
        <span>FORA DO ESCRITÓRIO. DENTRO DA PIZZARIA.</span>
        <span>
          Confraternização do time <Sparkles size={13} />
        </span>
      </div>
      <header className="header">
        <a className="brand" href="#">
          <span className="brand-icon">
            <PizzaIcon size={28} strokeWidth={1.7} />
          </span>
          <span>
            pizza<span className="brand-small">do time.</span>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <a className="nav-active" href="#cardapio">
            Cardápio
          </a>
          <button onClick={order.openResults}>
            <ChartNoAxesColumnIncreasing size={17} /> Placar do time
          </button>
        </nav>
        <span className="header-note">
          <span className="live-dot" /> Cada fatia conta.
        </span>
      </header>
      <main className="page">
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span /> A REUNIÃO MAIS SABOROSA DO ANO
            </div>
            <h1>
              Pizza da config<span>.</span>
            </h1>
            <p>
              Menos planilhas. Mais fatias. <strong>O próximo pedido é com você.</strong>
            </p>
            <a className="intro-link" href="#cardapio">
              Bora escolher <ArrowDown size={16} />
            </a>
          </div>
          <div className="intro-stamp" aria-label={`${MAX_SAVORY_PIZZAS} pizzas salgadas e ${MAX_SWEET_PIZZAS} doce por pessoa`}>
            <PizzaIcon size={30} />
            <strong>{MAX_SAVORY_PIZZAS} + {MAX_SWEET_PIZZAS}</strong>
            <span>salgadas + doce</span>
          </div>
        </section>
        <div className="content-layout">
          <MenuSection
            ballot={order.ballot}
            loading={order.loading}
            disabled={order.loading || order.saving || (!!order.error && !order.dirty)}
            onChange={order.change}
          />
          <OrderPanel
            ballot={order.ballot}
            saved={order.saved}
            count={order.count}
            dirty={order.dirty}
            loading={order.loading}
            saving={order.saving}
            error={order.error}
            results={order.results}
            resultsError={order.resultsError}
            remove={order.remove}
            submit={order.submit}
            reconnect={order.reconnect}
            openResults={order.openResults}
          />
        </div>
      </main>
      <footer>
        <span className="footer-brand">
          <PizzaIcon size={19} /> pizza da config.
        </span>
        <span>Feito para dividir a mesa. E multiplicar as histórias.</span>
        <span>Bom apetite, config!</span>
      </footer>
      <a className="mobile-order" href="#meu-pedido">
        <ShoppingBag size={19} />
        <span>Meu pedido</span>
        <strong>
          {order.count}/{MAX_SLICES}
        </strong>
        <ArrowRight size={18} />
      </a>
      {order.notice && (
        <div className="toast" role="status">
          <CheckCheck size={21} />
          {order.notice}
          <button className="icon-button" aria-label="Fechar aviso" onClick={order.dismissNotice}>
            <X size={17} />
          </button>
        </div>
      )}
      <OrderDialogs
        modal={order.modal}
        results={order.results}
        resultsError={order.resultsError}
        onClose={order.closeModal}
        onRefresh={order.refreshResults}
      />
    </>
  );
}
