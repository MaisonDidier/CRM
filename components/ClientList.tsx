"use client";

import { Client } from "@/types/client";
import ClientCard from "./ClientCard";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onRelanceUpdate: () => void;
}

export default function ClientList({
  clients,
  onEdit,
  onDelete,
  onRelanceUpdate,
}: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">Aucun client enregistré</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          onEdit={onEdit}
          onDelete={onDelete}
          onRelanceUpdate={onRelanceUpdate}
        />
      ))}
    </div>
  );
}

