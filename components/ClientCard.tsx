"use client";

import { useState, useRef } from "react";
import { Client } from "@/types/client";
import { normalizeApostrophes } from "@/lib/validation";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onRelanceUpdate: () => void;
}

export default function ClientCard({
  client,
  onEdit,
  onDelete,
  onRelanceUpdate,
}: ClientCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingRelance, setIsEditingRelance] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isRelanceRecent = (relanceEnvoyeeAt: string | null | undefined): boolean => {
    if (!relanceEnvoyeeAt) return false;
    const sentAt = new Date(relanceEnvoyeeAt).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - sentAt < twentyFourHours;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRelancePeriod = (dateRelance: string | null): string => {
    if (!dateRelance) return "";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const relanceDate = new Date(dateRelance);
    relanceDate.setHours(0, 0, 0, 0);
    
    // Calculer la différence en mois
    const monthsDiff = (relanceDate.getFullYear() - today.getFullYear()) * 12 + 
                       (relanceDate.getMonth() - today.getMonth());
    
    // Vérifier si ça correspond à une période standard (avec une tolérance de ±1 mois)
    if (monthsDiff >= 5 && monthsDiff <= 7) return "6 mois";
    if (monthsDiff >= 11 && monthsDiff <= 13) return "1 an";
    if (monthsDiff >= 17 && monthsDiff <= 19) return "18 mois";
    
    // Sinon, c'est personnalisé
    return "Personnalisé";
  };

  const updateRelanceDate = async (months: number | null, customDate?: string) => {
    setIsUpdating(true);
    try {
      let dateRelance: string;

      if (customDate) {
        dateRelance = customDate;
      } else if (months !== null) {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        dateRelance = date.toISOString();
      } else {
        return;
      }

      const response = await fetch(`/api/clients/${client.id}/relance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date_relance: dateRelance }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      setIsEditingRelance(false);
      onRelanceUpdate();
    } catch (err) {
      alert("Erreur lors de la mise à jour de la date de relance");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const dateInputId = `date-picker-${client.id}`;

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const date = new Date(value);
      date.setHours(12, 0, 0, 0);
      updateRelanceDate(null, date.toISOString());
      setShowDatePicker(false);
    }
  };

  const relanceRecent = isRelanceRecent(client.relance_envoyee_at);

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {normalizeApostrophes(client.prenom)} {normalizeApostrophes(client.nom)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{client.telephone}</p>
        </div>
        {relanceRecent && (
          <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
            Relancé
          </span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-2">
          <span className="font-medium">Date de relance :</span>{" "}
          {formatDate(client.date_relance)}
        </p>
        {client.message_relance && (
          <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
            <span className="font-medium">Message :</span>
            <p className="mt-1 whitespace-pre-wrap">{normalizeApostrophes(client.message_relance)}</p>
          </div>
        )}
      </div>

      <div className="mb-4 space-y-2">
        {client.date_relance && !isEditingRelance ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded">
              {getRelancePeriod(client.date_relance)}
            </span>
            <button
              onClick={() => setIsEditingRelance(true)}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Modifier
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium text-gray-600">Planifier la relance :</p>
            <div className="flex flex-wrap gap-2 relative">
              <button
                onClick={() => updateRelanceDate(6)}
                disabled={isUpdating}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                6 mois
              </button>
              <button
                onClick={() => updateRelanceDate(12)}
                disabled={isUpdating}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                1 an
              </button>
              <button
                onClick={() => updateRelanceDate(18)}
                disabled={isUpdating}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                18 mois
              </button>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                disabled={isUpdating}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                Personnalisé
              </button>
              {client.date_relance && (
                <button
                  onClick={() => { setIsEditingRelance(false); setShowDatePicker(false); }}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Annuler
                </button>
              )}
            </div>
            {showDatePicker && (
              <div className="mt-2">
                <input
                  id={dateInputId}
                  ref={dateInputRef}
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={handleCustomDateChange}
                  disabled={isUpdating}
                  className="w-full px-3 py-2 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => onEdit(client)}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
        >
          Modifier
        </button>
        <button
          onClick={() => onDelete(client.id)}
          className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

