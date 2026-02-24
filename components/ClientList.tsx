"use client";

import { useState } from "react";
import { Client } from "@/types/client";
import ClientCard from "./ClientCard";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onRelanceUpdate: () => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Non définie";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ClientList({
  clients,
  onEdit,
  onDelete,
  onRelanceUpdate,
}: ClientListProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">Aucun client enregistré</p>
      </div>
    );
  }

  const handleEdit = (client: Client) => {
    onEdit(client);
    setSelectedClient(null);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setSelectedClient(null);
  };

  return (
    <>
      {/* Vue mobile : liste compacte (nom, prénom, date relance) */}
      <div className="md:hidden bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {clients.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                onClick={() => setSelectedClient(client)}
                className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {client.prenom} {client.nom}
                  </span>
                </div>
                <span className="text-sm text-gray-600 shrink-0 ml-2">
                  Relance : {formatDate(client.date_relance)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Vue desktop : grille de cartes */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Modal détail client (mobile uniquement) */}
      {selectedClient && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col bg-white"
          role="dialog"
          aria-modal="true"
          aria-label="Détail du client"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedClient.prenom} {selectedClient.nom}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedClient(null)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ClientCard
              client={selectedClient}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRelanceUpdate={() => {
                onRelanceUpdate();
                setSelectedClient(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

