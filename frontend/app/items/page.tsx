import { getItems } from '@/lib/actions';
import ItemsList from '@/components/ItemsList';

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Items</h1>
      <ItemsList initialItems={items} />
    </main>
  );
}
