import { NextResponse } from "next/server";
import { verifyPassword, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérifier si CRM_PASSWORD est configuré
    if (!process.env.CRM_PASSWORD) {
      // Ne pas logger d'informations sensibles
      if (process.env.NODE_ENV !== "production") {
        console.error("❌ ERREUR: CRM_PASSWORD n'est pas défini dans les variables d'environnement");
      }
      return NextResponse.json(
        { 
          error: "Erreur de configuration serveur" 
        },
        { status: 500 }
      );
    }

    const isValid = await verifyPassword(password);

    if (!isValid) {
      // Ne pas exposer d'informations sur l'échec d'authentification
      // Utiliser un délai constant pour éviter les attaques par timing
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100));
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    await createSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
    
    // Si c'est une erreur de configuration, on l'affiche
    if (errorMessage.includes("CRM_PASSWORD")) {
      return NextResponse.json(
        { error: "Erreur de configuration : " + errorMessage },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

