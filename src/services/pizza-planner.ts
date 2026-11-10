import { isSweetPizza, type Results } from '../../shared/ballots.ts';

export const SLICES_PER_PIZZA = 8;
export const SLICES_PER_HALF = SLICES_PER_PIZZA / 2;
export const SAVORY_SLICES_PER_PERSON = 4;
export const SWEET_SLICES_PER_PERSON = 1;
export const SLICES_PER_PERSON = SAVORY_SLICES_PER_PERSON + SWEET_SLICES_PER_PERSON;

export type PizzaCategory = 'salgada' | 'doce';

export interface FlavorPortion {
  name: string;
  category: PizzaCategory;
  votes: number;
  halves: number;
}

export interface PlannedPizza {
  category: PizzaCategory;
  firstFlavor: string;
  secondFlavor: string;
}

export interface PizzaPlan {
  flavors: FlavorPortion[];
  pizzas: PlannedPizza[];
  requestedSlices: number;
  extraSlices: number;
  totalSlices: number;
  savoryPizzas: number;
  sweetPizzas: number;
}

function compareNames(first: FlavorPortion, second: FlavorPortion): number {
  return first.name < second.name ? -1 : first.name > second.name ? 1 : 0;
}

function distributeHalves(flavors: FlavorPortion[], slots: number): void {
  const totalVotes = flavors.reduce((total, flavor) => total + flavor.votes, 0);
  if (!totalVotes) return;

  const allocations = flavors.map(flavor => {
    const weightedSlots = flavor.votes * slots;
    flavor.halves = Math.floor(weightedSlots / totalVotes);
    return { flavor, remainder: weightedSlots % totalVotes };
  });
  let remaining = slots - flavors.reduce((total, flavor) => total + flavor.halves, 0);

  // Largest remainders preserve the exact slot budget without rounding drift.
  allocations.sort((first, second) =>
    second.remainder - first.remainder
    || second.flavor.votes - first.flavor.votes
    || compareNames(first.flavor, second.flavor));
  for (const { flavor } of allocations) {
    if (!remaining) break;
    flavor.halves += 1;
    remaining -= 1;
  }
}

function pairHalves(flavors: FlavorPortion[], category: PizzaCategory): PlannedPizza[] {
  const halves = flavors
    .filter(flavor => flavor.category === category)
    .flatMap(flavor => Array.from({ length: flavor.halves }, () => flavor.name));
  const pizzas: PlannedPizza[] = [];

  while (halves.length) {
    const firstFlavor = halves.shift()!;
    const otherFlavorIndex = halves.findIndex(flavor => flavor !== firstFlavor);
    const secondFlavor = (otherFlavorIndex >= 0 ? halves.splice(otherFlavorIndex, 1)[0] : undefined)
      ?? halves.shift()
      ?? firstFlavor;
    pizzas.push({ category, firstFlavor, secondFlavor });
  }

  return pizzas;
}

export function createPizzaPlan(results: Results): PizzaPlan {
  const votes = results.pizzas.filter(pizza => pizza.quantity > 0);
  const flavors: FlavorPortion[] = votes.map(pizza => ({
    name: pizza.name,
    category: isSweetPizza(pizza.name) ? 'doce' : 'salgada',
    votes: pizza.quantity,
    halves: 0,
  }));

  const requestedSlices = results.participants * SLICES_PER_PERSON;
  const totalPizzas = Math.ceil(requestedSlices / SLICES_PER_PIZZA);
  const savory = flavors.filter(flavor => flavor.category === 'salgada');
  const sweet = flavors.filter(flavor => flavor.category === 'doce');
  const sweetPizzas = !sweet.length ? 0 : !savory.length ? totalPizzas
    : Math.round(totalPizzas * SWEET_SLICES_PER_PERSON / SLICES_PER_PERSON);
  const savoryPizzas = totalPizzas - sweetPizzas;

  distributeHalves(savory, savoryPizzas * (SLICES_PER_PIZZA / SLICES_PER_HALF));
  distributeHalves(sweet, sweetPizzas * (SLICES_PER_PIZZA / SLICES_PER_HALF));
  flavors.sort((first, second) => second.halves - first.halves || second.votes - first.votes || compareNames(first, second));
  const pizzas = [
    ...pairHalves(flavors, 'salgada'),
    ...pairHalves(flavors, 'doce'),
  ];
  const totalSlices = pizzas.length * SLICES_PER_PIZZA;

  return {
    flavors,
    pizzas,
    requestedSlices,
    extraSlices: totalSlices - requestedSlices,
    totalSlices,
    savoryPizzas,
    sweetPizzas,
  };
}
