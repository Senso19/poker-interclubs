# Interclubs Poker

Site de gestion du tournoi interclubs entre **HPCL**, **19PokerClub**, **OPC** et **Les Lottois**.

## 1. Créer le projet Supabase


1. Sur [supabase.com](https://supabase.com), créez un nouveau projet.
2. Allez dans **SQL Editor**, collez le contenu de `sql/schema.sql`, exécutez.
   Cela crée les tables, les 4 clubs, un compte administrateur principal
   (`frederic` / `changez-moi` — **à changer dès la première connexion** via
   l'onglet "Comptes admin" de la page Administration), et le barème de
   points par défaut.
3. Dans **Project Settings > API**, récupérez `Project URL` et `anon public key`.

## 2. Configurer le projet en local

```bash
npm install
cp .env.example .env.local
# remplissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local
npm run dev
```

## 3. Déployer (GitHub → Vercel, comme vos autres apps)

1. Poussez ce dossier sur un nouveau dépôt GitHub.
2. Sur [vercel.com](https://vercel.com), importez le dépôt.
3. Dans les réglages du projet Vercel > **Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Déployez. Chaque push sur `main` redéploiera automatiquement.

## 4. Ajouter les logos des clubs

Le plus simple : hébergez chaque logo (par ex. sur un bucket Supabase Storage
public, ou simplement une image dans un repo GitHub via son URL "raw"), puis
mettez à jour la colonne `logo_url` de la table `clubs` dans Supabase Table
Editor. Sans logo, le site affiche l'enseigne du club (♠ ♥ ♦ ♣).

## Structure du site

- **`/`** — Connexion administrateur (identifiant + mot de passe).
- **`/clubs`** — Grands boutons vers la page de gestion de chaque club (accès
  réservé aux admins connectés ; l'administrateur principal voit les 4 clubs,
  un administrateur secondaire n'accède qu'au sien).
- **`/club/:slug`** — Choix du tournoi à venir + inscription des 10 joueurs
  du club, gestion de l'effectif.
- **`/admin`** — Réservé à l'administrateur principal : création des étapes
  (date, lieu, statut), gestion globale des joueurs, gestion des comptes
  administrateurs, et un onglet BlindValet en réserve pour la V2.
- **`/public`** — Vue publique des tournois et des joueurs inscrits, sans
  connexion nécessaire.
- **`/rankings`** — Classements individuel et club, visibles par tous. La
  saisie des résultats par étape (position + KO par joueur, via menus
  déroulants) et l'édition du barème de points sont réservées à
  l'administrateur principal.

## Système de points (barème par défaut, éditable)

| Place | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 20 | 16 | 14 | 12 | 10 | 8 | 6 | 4 | 2 | 1 |

+ 1 point par élimination (KO), également réglable.

Le barème est modifiable à tout moment depuis la page **Classements** (bouton
« Modifier le barème de points », visible uniquement par l'administrateur
principal) : les points de chaque joueur pour chaque étape sont recalculés
immédiatement selon le nouveau barème.

## BlindValet (prévu en V2)

L'inscription automatique des joueurs qualifiés vers BlindValet et la gestion
des tables/sièges ne sont pas incluses dans cette première version, pour
livrer d'abord une base solide (clubs, tournois, joueurs, classements). La
page Administration contient un onglet réservé à cet effet, prêt à être
complété — potentiellement en s'appuyant sur la même logique d'interception
que vos extensions Chrome BlindValet existantes.

## Sécurité des mots de passe

Les mots de passe des comptes administrateurs sont stockés en clair dans la
table `admins`, dans un souci de simplicité pour un usage interne entre 4
clubs (cohérent avec vos autres outils Socotec). Si le site devient public
et sensible, il serait préférable de migrer vers l'authentification native
Supabase (hachage, sessions sécurisées, etc.).
