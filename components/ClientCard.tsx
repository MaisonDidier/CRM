"use client";

import { useState } from "react";
import { Client } from "@/types/client";
import { normalizeApostrophes } from "@/lib/validation";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onRelanceUpdate: () => void;
}

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function ClientCard({
  client,
  onEdit,
  onDelete,
  onRelanceUpdate,
}: ClientCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingRelance, setIsEditingRelance] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const now = new Date();
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const hasBeenRelanced = !!client.relance_envoyee_at;

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

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const handleConfirmDate = () => {
    const day = Math.min(selectedDay, daysInMonth);
    const date = new Date(selectedYear, selectedMonth, day, 12, 0, 0, 0);
    updateRelanceDate(null, date.toISOString());
    setShowDatePicker(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {normalizeApostrophes(client.prenom)} {normalizeApostrophes(client.nom)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{client.telephone}</p>
        </div>
        {hasBeenRelanced && (
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
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-md bg-white"
                  >
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="flex-[2] px-2 py-2 text-sm border border-gray-300 rounded-md bg-white"
                  >
                    {MOIS.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-md bg-white"
                  >
                    {Array.from({ length: 5 }, (_, i) => now.getFullYear() + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleConfirmDate}
                    disabled={isUpdating}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
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

