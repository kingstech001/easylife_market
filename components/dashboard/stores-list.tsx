"use client";

import { useEffect, useState } from "react";

type Store = {
  _id: string;
  name: string;
  logo_url?: string;
};

export default function StoresList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch("/api/stores");
        const data = await res.json();

        // Ensure it's an array before setting
        if (Array.isArray(data)) {
          setStores(data);
        } else if (Array.isArray(data?.stores)) {
          setStores(data.stores);
        } else {
          setStores([]);
        }
      } catch (err) {
        console.error("Error fetching stores", err);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  return (
    <div>
      {loading && <p>Loading stores...</p>}
      {!loading && stores.length === 0 && <p>No stores found.</p>}

      {!loading &&
        stores.map((store) => (
          <div
            key={store._id}
            className="flex items-center justify-between space-x-4 rounded-lg border p-4"
          >
            <div className="flex items-center space-x-4">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-300" />
              )}
              <span>{store.name}</span>
            </div>
          </div>
        ))}
    </div>
  );
}
