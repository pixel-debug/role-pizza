import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { MAX_SLICES, countSlices, type Ballot, type Results } from '../../shared/ballots.ts';
import { pizzaApi } from '../services/pizza-api.ts';

export type OrderModal = 'welcome' | 'limit' | 'results' | null;
export type QuantityDelta = -1 | 1;

const RESULTS_INTERVAL_MS = 15_000;
const NOTICE_DURATION_MS = 5_000;
const WELCOME_STORAGE_KEY = 'pizza-welcome';
const emptyResults: Results = { pizzas: [], participants: 0, slices: 0 };

function fingerprint(ballot: Ballot): string {
  return JSON.stringify([...ballot].sort((first, second) => first.name.localeCompare(second.name)));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'O forno deu uma pausa. Tente novamente.';
}

export function usePizzaOrder() {
  const [ballot, setBallot] = useState<Ballot>([]);
  const [saved, setSaved] = useState<Ballot>([]);
  const [results, setResults] = useState<Results>(emptyResults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resultsError, setResultsError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<OrderModal>(null);
  const [retry, setRetry] = useState(0);
  const lifecycle = useRef<AbortController | null>(null);
  const submissionPending = useRef(false);
  const count = countSlices(ballot);
  const dirty = fingerprint(ballot) !== fingerprint(saved);

  async function refreshResults(signal = lifecycle.current?.signal): Promise<void> {
    if (!signal || signal.aborted) return;
    try {
      const nextResults = await pizzaApi.results(signal);
      if (signal.aborted) return;
      setResults(nextResults);
      setResultsError('');
    } catch {
      if (!signal.aborted) setResultsError('O placar está descansando. Tente atualizar.');
    }
  }

  const pollResults = useEffectEvent((signal: AbortSignal) => { void refreshResults(signal); });

  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    setLoading(true);

    void pizzaApi.readBallot(controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setBallot(data.ballot);
      setSaved(data.ballot);
      setError('');
      if (!sessionStorage.getItem(WELCOME_STORAGE_KEY)) setModal('welcome');
      pollResults(controller.signal);
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(errorMessage(failure));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    const timer = window.setInterval(() => pollResults(controller.signal), RESULTS_INTERVAL_MS);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [retry]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function closeModal(): void {
    if (modal === 'welcome') sessionStorage.setItem(WELCOME_STORAGE_KEY, '1');
    setModal(null);
  }

  function change(name: string, delta: QuantityDelta): void {
    if (loading || submissionPending.current) return;
    if (delta > 0 && count >= MAX_SLICES) { setModal('limit'); return; }
    setBallot(current => {
      if (delta > 0 && countSlices(current) >= MAX_SLICES) return current;
      const quantity = (current.find(pizza => pizza.name === name)?.quantity ?? 0) + delta;
      return [...current.filter(pizza => pizza.name !== name), ...(quantity > 0 ? [{ name, quantity }] : [])];
    });
  }

  function remove(name: string): void {
    if (loading || submissionPending.current) return;
    setBallot(current => current.filter(item => item.name !== name));
  }

  async function submit(): Promise<void> {
    const signal = lifecycle.current?.signal;
    if (loading || submissionPending.current || !dirty || !signal || signal.aborted) return;
    submissionPending.current = true;
    setSaving(true);
    setError('');
    try {
      const data = await pizzaApi.saveBallot(ballot, signal);
      if (signal.aborted) return;
      setBallot(data.ballot);
      setSaved(data.ballot);
      setNotice(data.ballot.length ? 'Pedido salvo! Seu próximo compromisso é com a pizza.' : 'Pedido cancelado. Seus votos foram retirados.');
      void refreshResults(signal);
    } catch (failure: unknown) {
      if (!signal.aborted) setError(errorMessage(failure));
    } finally {
      submissionPending.current = false;
      if (!signal.aborted) setSaving(false);
    }
  }

  function openResults(): void { setModal('results'); void refreshResults(); }
  function reconnect(): void {
    if (!submissionPending.current) setRetry(value => value + 1);
  }
  function dismissNotice(): void { setNotice(''); }

  return { ballot, saved, results, loading, saving, error, resultsError, notice, modal, count, dirty,
    change, remove, submit, closeModal, openResults, refreshResults, reconnect, dismissNotice };
}

export type PizzaOrder = ReturnType<typeof usePizzaOrder>;