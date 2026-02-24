"use client";

import { useState, useEffect, FormEvent } from "react";
import { Client } from "@/types/client";

interface ClientFormProps {
  client: Client | null;
  onClose: () => void;
  onSave: () => void;
}

const DEFAULT_MESSAGE =
  "Bonjour {{prenom}}, comme prévu ensemble il y a un an au magasin , voici le message qui nous rappelle que les dernières lunettes ont déjà un an .\nIl est possible de faire un point sur un réglage et d'éventuels remboursements …\nÀ très bientôt \nJean\n\nMaisonDidierOpticiens \n0603365536";

// Fonction de validation du numéro de téléphone
// Accepte les formats français et internationaux
function validatePhoneNumber(phone: string): boolean {
  // Supprimer les espaces, tirets, points et autres caractères de formatage
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "");
  
  // Vérifier que ce sont uniquement des chiffres (et éventuellement + au début)
  if (!/^\+?[0-9]+$/.test(cleaned)) {
    return false;
  }
  
  // Format français : 10 chiffres (peut commencer par 0 ou +33)
  // Format international : + suivi de 7 à 15 chiffres
  const frenchPattern = /^(0|\+33)[1-9][0-9]{8}$/;
  const internationalPattern = /^\+[1-9][0-9]{6,14}$/;
  const simplePattern = /^0[1-9][0-9]{8}$/; // Format simple 0X XX XX XX XX
  
  // Normaliser le format français avec +33
  const normalized = cleaned.startsWith("0") 
    ? "+33" + cleaned.substring(1)
    : cleaned.startsWith("33")
    ? "+" + cleaned
    : cleaned.startsWith("+")
    ? cleaned
    : cleaned;
  
  return frenchPattern.test(cleaned) || 
         internationalPattern.test(normalized) || 
         simplePattern.test(cleaned) ||
         /^[0-9]{10}$/.test(cleaned); // 10 chiffres simples
}

export default function ClientForm({ client, onClose, onSave }: ClientFormProps) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [messageRelance, setMessageRelance] = useState(DEFAULT_MESSAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (client) {
      setPrenom(client.prenom);
      setNom(client.nom);
      setTelephone(client.telephone);
      setMessageRelance(
        client.message_relance || DEFAULT_MESSAGE.replace("{{prenom}}", client.prenom)
      );
    } else {
      setPrenom("");
      setNom("");
      setTelephone("");
      setMessageRelance(DEFAULT_MESSAGE);
    }
  }, [client]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Autoriser uniquement les chiffres, espaces, tirets, points, parenthèses et +
    const cleaned = value.replace(/[^0-9\s\-\.\(\)\+]/g, "");
    setTelephone(cleaned);
    
    // Valider en temps réel
    if (cleaned && !validatePhoneNumber(cleaned)) {
      setPhoneError("Format invalide. Utilisez un numéro de téléphone valide (ex: 0612345678 ou +33612345678)");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setPhoneError("");
    setIsLoading(true);

    // Valider le numéro de téléphone avant la soumission
    if (!validatePhoneNumber(telephone)) {
      setPhoneError("Format invalide. Utilisez un numéro de téléphone valide (ex: 0612345678 ou +33612345678)");
      setIsLoading(false);
      return;
    }

    try {
      const messageWithPrenom = messageRelance.replace("{{prenom}}", prenom);

      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prenom,
          nom,
          telephone,
          message_relance: messageWithPrenom,
          date_relance: null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {client ? "Modifier le client" : "Ajouter un client"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="prenom"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Prénom *
              </label>
              <input
                id="prenom"
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom *
              </label>
              <input
                id="nom"
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="telephone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Téléphone *
              </label>
              <input
                id="telephone"
                type="tel"
                required
                value={telephone}
                onChange={handlePhoneChange}
                pattern="[0-9\s\-\.\(\)\+]{10,}"
                placeholder="0612345678 ou +33612345678"
                className={`w-full px-3 py-2 bg-gray-100 text-gray-900 border rounded-md focus:outline-none focus:ring-2 ${
                  phoneError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={isLoading}
              />
              {phoneError && (
                <p className="mt-1 text-xs text-red-600">{phoneError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Format accepté : 10 chiffres (ex: 0612345678) ou format international (ex: +33612345678)
              </p>
            </div>

            <div>
              <label
                htmlFor="messageRelance"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message de relance
              </label>
              <textarea
                id="messageRelance"
                rows={4}
                value={messageRelance}
                onChange={(e) => setMessageRelance(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Utilisez {"{{prenom}}"} pour insérer automatiquement le prénom
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

