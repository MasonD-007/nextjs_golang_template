import { getItems } from '@/lib/actions';
import ItemsList from '@/components/ItemsList';

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Items</h1>
      <ItemsList initialItems={items} />
    </main>
  );
}
