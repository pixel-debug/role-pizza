import { SWEET_PIZZA_NAMES } from '../shared/ballots.ts';

export type Category = 'Especiais' | 'Clássicas' | 'Doces';
export type Pizza = { name: string; description: string; category: Category; vegetarian: boolean; image: string; imageIsIllustrative: boolean };

const flavorPhotos: Readonly<Record<string, string>> = {
  'Burrata com Parma': '/pizzas/burrata-com-parma.jpeg',
  'Serrana': '/pizzas/serrana.jpeg',
  'Pepperoni': '/pizzas/pepperoni.jpeg',
  'Di Parma': '/pizzas/di-parma.jpeg',
  'Caciocavallo': '/pizzas/caciocavallo.jpeg',
  'Calábria': '/pizzas/calabria.jpeg',
  'Zucchini': '/pizzas/zucchini.jpeg',
  'Melanzana': '/pizzas/melanzana.jpeg',
  'Carciofini': '/pizzas/carciofini.jpeg',
  'Fiorentina': '/pizzas/fiorentina.jpeg',
  'Caprese': '/pizzas/caprese.jpeg',
  'Alecrim': '/pizzas/alecrim.jpeg',
  'La Bufalina': '/pizzas/la-bufalina.jpeg',
  'Peccato': '/pizzas/peccato.jpeg',
  'Lombardia': '/pizzas/lombardia.jpeg',
  'Castelões': '/pizzas/casteloes.jpeg',
  'Bacio': '/pizzas/bacio.jpeg',
  'Quatro Estações': '/pizzas/quatro-estacoes.jpeg',
  'Carbonara': '/pizzas/carbonara.jpeg',
  'Diavoletti': '/pizzas/diavoletti.jpeg',
  'Brócolis': '/pizzas/brocolis.jpeg',
  'Romana': '/pizzas/romana.jpeg',
  'Calabresa': '/pizzas/calabresa.jpeg',
  'Portuguesa': '/pizzas/portuguesa.jpeg',
  'Frango com catupiry': '/pizzas/frango-com-catupiry.jpeg',
  'Lombinho com catupiry': '/pizzas/lombinho-com-catupiry.jpeg',
  'Peito de Peru': '/pizzas/peito-de-peru.jpeg',
  'Atum': '/pizzas/atum.jpeg',
  'Mussarela': '/pizzas/mussarela.jpeg',
  'Siciliana': '/pizzas/siciliana.jpeg',
  'Quatro Queijos': '/pizzas/quatro-queijos.jpeg',
  'Gorgonzola': '/pizzas/gorgonzola.jpeg',
  'Alho e óleo': '/pizzas/alho-e-oleo.jpeg',
  'Aliche': '/pizzas/aliche.jpeg',
  'Morango com chocolate': '/pizzas/morango-com-chocolate.jpeg',
  'Banana com chocolate': '/pizzas/banana-com-chocolate.jpeg',
  'Banana': '/pizzas/banana.jpeg',
};

const photos = {
  cheese: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=640&q=80',
  meat: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=640&q=80',
  green: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=640&q=80',
  sweet: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=640&q=80',
};
type Entry = [string, string, boolean, keyof typeof photos];
const specials: Entry[] = [
  ['Burrata com Parma', 'Molho de tomate italiano, burrata La Bufalina servida fria, fatias finas de presunto Di Parma e pesto de manjericão.', false, 'meat'],
  ['Quatro queijos especial', 'Molho de tomates italianos, queijos da Canastra maturado e jovem, Gouda, queijo do Reino e um pouco de requeijão para dar cremosidade.', true, 'cheese'],
  ['Serrana', 'Requeijão, palmitos, cebolas e parmesão com 12 meses de cura.', true, 'cheese'],
  ['Pepperoni', 'Mussarela, pepperoni, tomates-cereja e folhas de manjericão.', false, 'meat'],
  ['Gênova', 'Mussarela de búfala La Bufalina, pesto de manjericão (autêntica receita do Pesto Genovês) e tomates-cereja.', true, 'green'],
  ['Caciocavallo', 'Queijo Caciocavallo, tomates-cereja e salame calabrês artesanal em fatias finas.', false, 'meat'],
  ['Calábria', 'Mussarela, linguiça calabresa artesanal, manjericão e parmesão com 12 meses de cura.', false, 'meat'],
  ['Fungui', 'Mussarela, shitake, shimeji e champignons frescos salteados no azeite, parmesão com 12 meses de cura e tomilho.', true, 'green'],
  ['Castelões', 'Mussarela coberta com calabresa artesanal.', false, 'meat'],
  ['Bacio', 'Mussarela, provolone, pedaços de tomates e lascas de azeitonas pretas.', true, 'cheese'],
];
const classics: Entry[] = [
  ['Frango com catupiry', 'Peito de frango desfiado e coberto com Catupiry.', false, 'cheese'],
  ['Lombinho com catupiry', 'Lombo canadense, cebolas e cobertura de Catupiry.', false, 'meat'],
  ['Peito de Peru', 'Fatias de peito de peru defumado, alho-poró e Catupiry.', false, 'cheese'],
  ['Mussarela', 'Mussarela sobre a tradicional massa de longa fermentação do Armazém e molho de tomates italianos.', true, 'cheese'],
  ['Quatro Queijos', 'Mussarela, Catupiry, gorgonzola e parmesão com 12 meses de cura.', true, 'cheese'],
];
const sweetDescriptions: Readonly<Record<(typeof SWEET_PIZZA_NAMES)[number], string>> = {
  'Morango com chocolate': 'Morangos frescos cobertos com chocolate ao leite.',
  'Banana com chocolate': 'Bananas, açúcar e canela caramelizados no forno, baunilha e cobertura de chocolate ao leite.',
  Chocolate: 'Chocolate. A descrição de ingredientes não aparece nas imagens do cardápio.',
  Banana: 'Bananas, açúcar e canela caramelizados no forno e baunilha.',
};
const visibleSweetPizzaNames = ['Morango com chocolate', 'Chocolate', 'Banana'] as const;
const sweets: Entry[] = visibleSweetPizzaNames.map(name => [name, sweetDescriptions[name], true, 'sweet']);
export const menu: Pizza[] = ([['Especiais', specials], ['Clássicas', classics], ['Doces', sweets]] as [Category, Entry[]][])
  .flatMap(([category, entries]) => entries.map(([name, description, vegetarian, photo]) => ({
    name,
    description,
    category,
    vegetarian,
    image: flavorPhotos[name] ?? photos[photo],
    imageIsIllustrative: !flavorPhotos[name],
  })));
