
# Guidelines de Développement – Application RAG (Python + Next.js)

## 1. Objectifs généraux
- Produire un code robuste, fiable, documenté.
- Suivre des bonnes pratiques de sécurité, performance et maintenabilité.
- Normaliser les conventions pour que l’IA génère un code cohérent à chaque étape du projet.

---

## 2. Structure du projet
- Séparer strictement front-end et back-end.
- Respecter les conventions suivantes :
  - `/backend`: FastAPI, logique métier, traitement PDF, embeddings, RAG.
  - `/frontend`: Next.js, interface utilisateur, endpoints client uniquement.
  - `.env` jamais versionné.
  - Modules clairement séparés : `chunking`, `llm`, `vectorstore`, `routes`.

---

## 3. Standards Python (Back-end)
### 3.1. Style & conventions
- Respect PEP8.
- Nom des fichiers en `snake_case`.
- Fonctions courtes, nom explicatif.
- Aucun mot-clé offensif ou variable obscure.
- Toujours typer les fonctions : `def ma_fonction(x: int) -> str:`.

### 3.2. Sécurité du code
- Jamais afficher les clés API dans les logs.
- Charger les secrets via `python-dotenv`.
- Vérifier chaque input utilisateur.
- Aucune donnée directement envoyée à OpenAI sans filtrage.

### 3.3. Performance & fiabilité
- Réutiliser les clients OpenAI et Supabase (singleton).
- Chunking optimisé : pas de surcharge mémoire.
- Logging structuré : `logging.info()`, `warning()`, `error()`.
- Tests unitaires indispensables pour : chunking, embeddings, recherche, endpoints.

---

## 4. Standards Next.js (Front-end)
### 4.1. Structure
- Utiliser App Router.
- Composants isolés : `ChatBubble`, `ChatWindow`, `Uploader`.
- Jamais d’appels à l’API Back-end côté serveur.

### 4.2. Qualité UI
- TailwindCSS.
- Respect des guidelines d’accessibilité.
- Ne jamais bloquer l’interface lors d’un appel API.

### 4.3. Sécurité côté front
- Aucune clé secrète dans le front.
- Validation stricte des champs utilisateur.
- Aucune donnée utilisateur stockée dans `localStorage` sans chiffrement.

---

## 5. Règles RAG strictes
### 5.1. Gestion des données
- Chunking toujours effectué avant vectorisation.
- Embeddings : `text-embedding-3-large`.
- Stockage dans Supabase avec métadonnées.

### 5.2. Recherche vectorielle
- Top-K = 5 par défaut.
- Similarité cosine.

### 5.3. Génération LLM
- Modèle : `gpt-4.1-mini`.
- Température = 0.
- Règle d'or : **Le bot ne doit JAMAIS inventer**.
- Si l'information n’existe pas dans les PDFs :
  > « Information absente des documents. »

---

## 6. Tests & validation
- Tests unitaires Python via `pytest`.
- Tests front-end via `Jest`.
- Tests fonctionnels sur chaque étape : upload, chunking, embeddings, réponse.

---

## 7. Logging & Monitoring
- Logs back-end : format JSON.
- Aucun log ne doit contenir : clés API, embeddings bruts, prompts complets.

---

## 8. Documentation
Chaque module doit contenir :
- Docstring globale.
- Exemple d'utilisation.
- Description des paramètres et retours.

README global doit inclure :
- Installation.
- Lancement.
- Architecture.
- Sécurité.
- Variables d’environnement.

---

## 9. Règles IA (pour génération automatique du code)
- Toujours produire un code robuste et commenté.
- Toujours proposer les bonnes pratiques.
- Toujours refuser d’exposer une clé API.
- Toujours fournir une organisation cohérente.
- Toujours vérifier la présence des données avant traitement.
- Toujours générer des messages d’erreur explicites.
- Toujours séparer le front du back.

