# 🌴 Pinky Party - Premium 3D Landing Page & Booking Engine

Bienvenue sur le projet finalisé de la landing page **Pinky Party** ! Ce projet a été conçu selon des normes de développement haut de gamme (Full-stack Senior) pour offrir une expérience VIP immersive tout en assurant une capture de leads fiable et automatisée pour votre pool party exclusive à Bizerte.

---

## 🚀 Fonctionnalités Clés du Projet

### 🎨 Front-end VIP Immersif
*   **Portail d'Entrée 3D** : Un écran d'accueil d'introduction stylé pour forcer l'interaction utilisateur et contourner les restrictions de lecture audio automatique des navigateurs.
*   **Audio Afro House Fluide** : Lecture automatique dès l'entrée sur le site, avec un bouton de contrôle flottant (Play/Mute) animé par un égaliseur dynamique.
*   **Effet 3D Tilt Persistant** : L'affiche et le formulaire pivotent en 3D selon les mouvements de la souris de l'utilisateur (effet désactivé sur mobile pour l'ergonomie).
*   **Design Glassmorphism Premium** : Le formulaire et les éléments textuels utilisent des reflets de verre dépoli transparents pour laisser passer le fond d'écran VIP tout en restant 100% lisibles.
*   **Lasers de Club 3D Animés** : Deux lasers lumineux animés (bleu et rose) qui balayent l'arrière-plan du site.

### ⏱️ Section "Coming Soon" et Countdown
*   **Compte à Rebours en Temps Réel** : Un timer néon qui calcule et affiche dynamiquement le temps restant (Jours, Heures, Minutes) jusqu'à la date de l'événement (**1er Juillet 2026**).
*   **Optimisation Responsive** : Le bloc s'affiche magnifiquement sur Desktop et se masque proprement sur mobile pour laisser toute la place au formulaire.

### 📊 Système de Réservation & Base de Données
*   **Formulaire Compact Premium** : Validation en direct du nombre de places sélectionnées par rapport au stock restant.
*   **Base de Données SQLite** : Toutes les réservations sont enregistrées de façon permanente dans une base SQLite locale (`server/database.db`) plutôt que dans le stockage temporaire du navigateur.
*   **Gestion des Stocks en Temps Réel** : Capacité maximale fixée à **50 places**. La barre de progression visuelle change de couleur selon le taux de remplissage (Rose/Bleu -> Jaune -> Rouge).
*   **Sécurité Sold Out** : Blocage automatique et affichage "ÉVÉNEMENT COMPLET ❌" dès que les 50 places sont réservées.

### 💬 Notifications Automatiques & Doubles Canaux WhatsApp
*   **Notification WhatsApp Automatisée (Backend)** : Envoi automatique d'une alerte structurée aux deux organisateurs dès la soumission du formulaire via le service gratuit **CallMeBot**.
*   **Raccourcis Manuels de Secours** : Écran de succès affichant un code unique (`PINK-XXXX`) avec deux boutons directs :
    *   **WhatsApp Sam** (+216 92 711 794)
    *   **WhatsApp Amouda** (+216 58 520 774)
    *   Les deux boutons génèrent instantanément un message pré-rempli avec le nom, le nombre de places et le code de réservation de l'utilisateur.

### 🔐 Tableau de Bord Administrateur VIP
*   Accès sécurisé par mot de passe (**`pinky2026`**) via le lien "Organisateur" dans le pied de page.
*   Affichage en temps réel de toutes les réservations enregistrées en base de données.
*   **Barre de Recherche en Direct** : Recherche instantanée par nom, téléphone, Instagram ou code unique.
*   **Actions Administrateur** :
    *   Changement du statut de paiement par simple clic (bascule entre **Payé** et **En attente**).
    *   Suppression individuelle d'une réservation (libère instantanément les places sur le compteur !).
    *   Bouton **Tout effacer** sécurisé avec avertissement.
    *   **Export CSV Professionnel** : Téléchargement en un clic de la liste complète des réservations compatible avec Excel.

---

## 🛠️ Structure Finale des Fichiers

```text
3D/
├── public/                 # Dossier Front-end (Fichiers statiques servis au client)
│   ├── index.html          # Structure de la page, Coming Soon et formulaires
│   ├── style.css           # Design haut de gamme, effets de néons, glassmorphism et animations
│   ├── script.js           # Gestion des formulaires, API Fetch, countdown et animations sparkles
│   └── assets/
│       └── background.png  # Fond d'écran professionnel VIP de la soirée
│
├── server/                 # Dossier Back-end (Logique serveur et base de données)
│   ├── server.js           # API Express, gestion SQLite, et envoi de notifications WhatsApp
│   └── database.db         # Fichier de base de données SQLite (créé automatiquement)
│
├── .env                    # Fichier de configuration sécurisé pour vos clés WhatsApp
├── package.json            # Dépendances Node.js et scripts de lancement
└── README.md               # Le présent guide
```

---

## 🔌 Lancement Local (Sur votre ordinateur)

1.  **Démarrage du Serveur** :
    Ouvrez votre terminal dans le dossier du projet et lancez le serveur :
    ```bash
    npm run start
    ```
2.  **Accès au Site** :
    Une fois démarré, ouvrez votre navigateur Chrome et visitez :
    👉 **[http://localhost:3000](http://localhost:3000)**

---

## 💬 Configuration des Notifications WhatsApp Automatiques

Le système utilise **CallMeBot**, une API WhatsApp gratuite et ultra simple d'utilisation pour les développeurs.

### Étape 1 : Obtenir vos clés d'API gratuites
Chaque organisateur (Sam et Amouda) doit effectuer cette étape rapide sur son propre téléphone pour autoriser le bot à lui envoyer des messages :
1.  Enregistrez le numéro de CallMeBot dans vos contacts WhatsApp : **`+34 644 66 84 40`** (ou scannez le QR code sur [callmebot.com](https://www.callmebot.com)).
2.  Envoyez le message WhatsApp suivant à ce contact :
    ```text
    I allow callmebot to send me messages
    ```
3.  Le bot va vous répondre immédiatement en vous donnant votre **APIKEY** personnelle unique.

### Étape 2 : Configurer le fichier `.env` de votre projet
Ouvrez le fichier **`.env`** qui se trouve à la racine de votre projet avec votre éditeur de code et insérez vos clés respectives :
```env
# Clé API pour Sam (+216 92 711 794)
CALLMEBOT_APIKEY_SAM=VOTRE_CLE_ICI

# Clé API pour Amouda (+216 58 520 774)
CALLMEBOT_APIKEY_AMOUDA=VOTRE_CLE_ICI
```
Redémarrez votre serveur. C'est tout ! Dès qu'un client réserve, vous recevrez instantanément une notification WhatsApp automatique et ultra-détaillée !

---

## 🌐 Déploiement Gratuit sur Internet (Hébergement en ligne)

Pour rendre votre site accessible à tous vos clients sur Internet avec son backend SQLite, le service gratuit **Render.js** est la meilleure option :

### Étape 1 : Publier votre code sur GitHub
1.  Créez un compte gratuit sur [GitHub](https://github.com).
2.  Créez un nouveau dépôt privé ou public nommé `pinky-party`.
3.  Poussez vos fichiers de code sur GitHub (en excluant le dossier `node_modules` et le fichier `.env`).

### Étape 2 : Lancer le projet sur Render
1.  Créez un compte gratuit sur [Render](https://render.com).
2.  Cliquez sur **New** -> **Web Service**.
3.  Connectez votre compte GitHub et sélectionnez votre dépôt `pinky-party`.
4.  Configurez les paramètres suivants :
    *   **Runtime** : `Node`
    *   **Build Command** : `npm install`
    *   **Start Command** : `node server/server.js`
5.  Allez dans l'onglet **Environment** de Render et ajoutez vos variables :
    *   `CALLMEBOT_APIKEY_SAM` = `votre_clé`
    *   `CALLMEBOT_APIKEY_AMOUDA` = `votre_clé`
6.  Cliquez sur **Deploy Web Service** ! Votre site est en ligne avec un lien sécurisé `https://...` gratuit !
