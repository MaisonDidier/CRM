export interface Client {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  message_relance: string;
  date_relance: string | null;
  relance_envoyee_at?: string | null;
  created_at: string;
}

