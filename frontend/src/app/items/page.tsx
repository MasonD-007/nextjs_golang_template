import { getItems } from '@/lib/actions';
import ItemsList from '@/components/ItemsList';

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Items</h1>
        <ItemsList initialItems={items} />
      </div>
    </main>
  );
}
