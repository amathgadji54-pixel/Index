# 🗺️ Sunu Yoon — Backend API

API REST Node.js + Express + MySQL pour l'application de navigation Dakar.

---

## ⚡ Installation (étape par étape)

### 1. Ouvre un terminal dans VS Code et installe les dépendances
```bash
npm install
```

### 2. Configure la base de données
- Ouvre **MySQL Workbench** (ou ton client MySQL)
- Exécute le fichier `database.sql` pour créer les tables
- Ou via terminal :
```bash
mysql -u root -p < database.sql
```

### 3. Configure le fichier `.env`
Ouvre `.env` et remplace :
```
DB_PASSWORD=ton_mot_de_passe   ← met ton vrai mot de passe MySQL
```

### 4. Lance le serveur
```bash
# Mode développement (redémarrage automatique)
npm run dev

# Mode normal
npm start
```

Tu dois voir :
```
✅ MySQL connecté avec succès
╔════════════════════════════════════╗
║   🗺️  SUNU YOON — Backend API       ║
║   ✅  Serveur lancé sur port 3000   ║
╚════════════════════════════════════╝
```

---

## 🧪 Tester l'API

Utilise **Postman** ou l'extension **Thunder Client** dans VS Code.

### S'inscrire
```
POST http://localhost:3000/api/auth/inscription
Body (JSON) :
{
  "nom": "Oumar Diallo",
  "email": "oumar@test.sn",
  "mot_de_passe": "monmotdepasse"
}
```

### Se connecter
```
POST http://localhost:3000/api/auth/connexion
Body (JSON) :
{
  "email": "oumar@test.sn",
  "mot_de_passe": "monmotdepasse"
}
→ Récupère le "token" dans la réponse
```

### Voir les obstacles
```
GET http://localhost:3000/api/obstacles
```

### Signaler un obstacle (avec token)
```
POST http://localhost:3000/api/obstacles
Headers : Authorization: Bearer <ton_token>
Body (JSON) :
{
  "type": "embouteillage",
  "latitude": 14.6928,
  "longitude": -17.4467,
  "lieu": "Rond-point Liberté 6",
  "description": "Bouchon important"
}
```

### Calculer un itinéraire
```
GET http://localhost:3000/api/itineraire?depart_lat=14.6928&depart_lng=-17.4467&arrivee_lat=14.7167&arrivee_lng=-17.4677
```

---

## 📁 Structure du projet
```
sunu-yoon-backend/
├── server.js              ← Point d'entrée
├── .env                   ← Configuration (DB, JWT)
├── database.sql           ← Script création BDD
├── package.json
├── config/
│   └── db.js              ← Connexion MySQL
├── middleware/
│   └── auth.js            ← Vérification JWT
├── controllers/
│   ├── authController.js      ← Inscription / Connexion
│   ├── obstacleController.js  ← Signalements
│   └── itineraireController.js ← Calcul d'itinéraire
└── routes/
    ├── auth.js
    ├── obstacles.js
    └── itineraire.js
```

---

## 🔗 Connecter le frontend

Dans ton fichier `index.html`, remplace les données simulées par des appels API :
```javascript
// Exemple : charger les obstacles depuis l'API
const res = await fetch('http://localhost:3000/api/obstacles');
const data = await res.json();
// data.obstacles → tableau des obstacles à afficher sur la carte
```
