import { adaptNode } from '../src/js/workers/donesWorker.js';
import { rebuildTreeArray, recalcAll, getTotals } from '../src/js/workers/costsWorker.js';

function manualTotals(tree, globalQty) {
  function traverse(node, parentQty) {
    const countTotal = node.count * parentQty;
    let totalBuy = (node.buy_price || 0) * countTotal;
    let totalSell = (node.sell_price || 0) * countTotal;
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const res = traverse(child, countTotal);
        totalBuy += res.totalBuy;
        totalSell += res.totalSell;
      }
    }
    node.total_buy = totalBuy;
    node.total_sell = totalSell;
    return { totalBuy, totalSell };
  }
  const totals = { totalBuy: 0, totalSell: 0 };
  for (const ing of tree) {
    const res = traverse(ing, globalQty);
    totals.totalBuy += res.totalBuy;
    totals.totalSell += res.totalSell;
  }
  return totals;
}

async function main() {
  const sample = [
    {
      id: 19675,
      name: 'Trébol místico',
      count: 1,
      components: [
        { id: 19976, name: 'Moneda mística', count: 2 },
        { id: 19721, name: 'Pegote de ectoplasma', count: 3 }
      ]
    },
    { id: 19721, name: 'Pegote de ectoplasma', count: 4 }
  ];
  const ingredientTree = await Promise.all(sample.map(ing => adaptNode(ing, null)));
  const manual = manualTotals(JSON.parse(JSON.stringify(ingredientTree)), 1);
  const objs = rebuildTreeArray(JSON.parse(JSON.stringify(ingredientTree)));
  recalcAll(objs, 1);
  const totals = getTotals(objs);
  console.log('manual totals', manual);
  console.log('worker totals', totals);
}

main().catch(err => { console.error(err); process.exit(1); });
