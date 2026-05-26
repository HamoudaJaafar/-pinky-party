const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la capacité maximale
const MAX_PLACES = 50;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// BASE DE DONNÉES HYBRIDE (SQLite / PostgreSQL)
// ==========================================
let isPostgres = false;
let pgClient = null;
let sqliteDb = null;

if (process.env.DATABASE_URL) {
    console.log("🔌 Détection de DATABASE_URL. Connexion à PostgreSQL...");
    const { Client } = require('pg');
    pgClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Requis pour Render, Supabase, Neon
        }
    });
    pgClient.connect()
        .then(() => {
            console.log("✅ Connecté avec succès à PostgreSQL.");
            isPostgres = true;
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS reservations (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    fullname VARCHAR(255) NOT NULL,
                    phone VARCHAR(50) NOT NULL,
                    instagram VARCHAR(100) NOT NULL,
                    places INTEGER NOT NULL,
                    total VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `;
            return pgClient.query(createTableQuery);
        })
        .then(() => {
            console.log("✅ Table 'reservations' PostgreSQL prête.");
        })
        .catch(err => {
            console.error("❌ Erreur de connexion à PostgreSQL :", err.message);
            console.log("⚠️ Repli sur SQLite local...");
            initSQLite();
        });
} else {
    console.log("🔌 Pas de DATABASE_URL détectée. Utilisation de SQLite local...");
    initSQLite();
}

function initSQLite() {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'database.db');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error("Erreur de connexion à SQLite :", err.message);
        } else {
            console.log("Connecté à la base de données SQLite.");
        }
    });

    sqliteDb.serialize(() => {
        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE,
                fullname TEXT NOT NULL,
                phone TEXT NOT NULL,
                instagram TEXT NOT NULL,
                places INTEGER NOT NULL,
                total TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error("Erreur lors de la création de la table SQLite :", err.message);
            } else {
                console.log("Table 'reservations' SQLite prête.");
            }
        });
    });
}

// Promisification des requêtes pour supporter les deux bases de manière générique
function dbGet(query, params = []) {
    return new Promise((resolve, reject) => {
        if (isPostgres) {
            let pgQuery = query;
            params.forEach((_, index) => {
                pgQuery = pgQuery.replace('?', `$${index + 1}`);
            });
            pgClient.query(pgQuery, params)
                .then(res => resolve(res.rows[0] || null))
                .catch(err => reject(err));
        } else {
            sqliteDb.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        }
    });
}

function dbAll(query, params = []) {
    return new Promise((resolve, reject) => {
        if (isPostgres) {
            let pgQuery = query;
            params.forEach((_, index) => {
                pgQuery = pgQuery.replace('?', `$${index + 1}`);
            });
            pgClient.query(pgQuery, params)
                .then(res => resolve(res.rows))
                .catch(err => reject(err));
        } else {
            sqliteDb.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }
    });
}

function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        if (isPostgres) {
            let pgQuery = query;
            params.forEach((_, index) => {
                pgQuery = pgQuery.replace('?', `$${index + 1}`);
            });
            pgClient.query(pgQuery, params)
                .then(res => resolve({ lastID: null, changes: res.rowCount }))
                .catch(err => reject(err));
        } else {
            sqliteDb.run(query, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        }
    });
}

// ==========================================
// FONCTION D'ENVOI WHATSAPP (CallMeBot)
// ==========================================
// ==========================================
// FONCTIONS D'ENVOI WHATSAPP (META CLOUD API & CALLMEBOT)
// ==========================================

// 1. WhatsApp Cloud API Officielle (Meta)
async function sendWhatsAppCloudAPINotification(booking) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1171876858088077';
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!accessToken) {
        console.log("⚠️ Notification WhatsApp Cloud API ignorée (WHATSAPP_ACCESS_TOKEN non configuré).");
        return;
    }

    if (accessToken.startsWith('__n8n_BLANK_VALUE')) {
        console.warn("⚠️ Le token d'accès WhatsApp fourni est un placeholder n8n. Veuillez le remplacer par la vraie clé dans votre fichier .env ou sur Render.");
        return;
    }

    // Message pré-formaté pour WhatsApp Cloud API
    const messageText = 
`🎉 *Nouvelle réservation Pinky Party* 🎉

👤 *Nom* : ${booking.fullname}
📞 *Téléphone* : ${booking.phone}
📸 *Instagram* : ${booking.instagram}
🎟 *Places* : ${booking.places}
💰 *Total* : ${booking.total}
🔑 *Code* : ${booking.code}

*Date* : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const recipients = ['21692711794', '21658520774']; // Hamouda et Bicha

    for (const to of recipients) {
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "text",
            text: {
                preview_url: false,
                body: messageText
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();
            if (response.ok) {
                console.log(`✅ Notification WhatsApp Cloud API envoyée avec succès à ${to}`);
            } else {
                console.warn(`❌ Échec de notification WhatsApp Cloud API pour ${to} :`, JSON.stringify(responseData));
            }
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi WhatsApp Cloud API à ${to} :`, error.message);
        }
    }
}

// 2. CallMeBot WhatsApp (Canal de secours gratuit)
async function sendWhatsAppNotification(booking) {
    // Déclencher aussi l'envoi WhatsApp Cloud API
    sendWhatsAppCloudAPINotification(booking).catch(err => {
        console.error("Erreur de notification WhatsApp Cloud API :", err.message);
    });

    // Générer les informations pour le QR Code
    const nameParts = booking.fullname.split(' ');
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || booking.fullname;
    
    const qrData = {
        "nom": nom,
        "prenom": prenom,
        "telephone": booking.phone,
        "code": booking.code,
        "places": parseInt(booking.places),
        "date": "1er Juillet 2026 - 21h00"
    };
    
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}`;
    
    // Message pré-formaté pour WhatsApp CallMeBot
    const messageText = 
`🎉 *Nouvelle réservation Pinky Party* 🎉

👤 *Nom* : ${booking.fullname}
📞 *Téléphone* : ${booking.phone}
📸 *Instagram* : ${booking.instagram}
🎟 *Places* : ${booking.places}
💰 *Total* : ${booking.total}
🔑 *Code* : ${booking.code}

🔗 *QR Code d'entrée* : ${qrImageUrl}

*Date* : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const encodedMsg = encodeURIComponent(messageText);

    // CallMeBot configuration depuis le fichier .env
    const apikeyHamouda = process.env.CALLMEBOT_APIKEY_HAMOUDA; // pour le +21692711794 (Hamouda)
    const apikeyBicha = process.env.CALLMEBOT_APIKEY_BICHA;     // pour le +21658520774 (Bicha)

    const apiConfigs = [
        { name: 'Hamouda', phone: '21692711794', apikey: apikeyHamouda },
        { name: 'Bicha', phone: '21658520774', apikey: apikeyBicha }
    ];

    for (const config of apiConfigs) {
        if (!config.apikey) {
            console.log(`⚠️ Notification ignorée pour ${config.name} (Pas de clé d'API CallMeBot configurée).`);
            continue;
        }

        const url = `https://api.callmebot.com/whatsapp.php?phone=${config.phone}&text=${encodedMsg}&apikey=${config.apikey}`;
        
        try {
            const response = await fetch(url);
            if (response.ok) {
                console.log(`✅ Notification WhatsApp envoyée avec succès à ${config.name}`);
            } else {
                console.warn(`❌ Échec de notification pour ${config.name} (Statut : ${response.status})`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi de la notification WhatsApp à ${config.name} : `, error.message);
        }
    }
}

// ==========================================
// API ENDPOINTS (ROUTES)
// ==========================================

// Route directe et intuitive pour accéder au Dashboard Admin
// Route pour servir le front-end
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/admin', (req, res) => {
    res.redirect('/#admin');
});

// 1. Récupérer les statistiques de capacité
app.get('/api/stats', async (req, res) => {
    try {
        const row = await dbGet("SELECT SUM(places) as totalbooked FROM reservations");
        const totalBooked = parseInt(row ? (row.totalbooked || row.totalBooked || 0) : 0);
        const remaining = Math.max(0, MAX_PLACES - totalBooked);
        res.json({
            maxPlaces: MAX_PLACES,
            totalBooked: totalBooked,
            remaining: remaining
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Soumettre une nouvelle réservation
app.post('/api/reserve', async (req, res) => {
    const { fullname, phone, instagram, places } = req.body;
    
    if (!fullname || !phone || !instagram || !places) {
        return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const ticketQty = parseInt(places);
    const pricePerTicket = 80;
    const totalAmount = `${ticketQty * pricePerTicket} DT`;

    try {
        // Vérifier la capacité restante
        const row = await dbGet("SELECT SUM(places) as totalbooked FROM reservations");
        const totalBooked = parseInt(row ? (row.totalbooked || row.totalBooked || 0) : 0);
        const remaining = MAX_PLACES - totalBooked;

        if (ticketQty > remaining) {
            return res.status(400).json({ error: `Désolé, il ne reste que ${remaining} place(s) disponible(s).` });
        }

        // Générer le code unique
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const bookingCode = `PINK-${randomNum}`;

        // Standardiser l'arobase Instagram et le format de téléphone
        const igHandle = instagram.startsWith('@') ? instagram : `@${instagram}`;
        const phoneFormatted = phone.startsWith('+216') ? phone : `+216 ${phone}`;

        // Enregistrer en base
        const sql = `INSERT INTO reservations (code, fullname, phone, instagram, places, total, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`;
        await dbRun(sql, [bookingCode, fullname, phoneFormatted, igHandle, ticketQty, totalAmount]);

        const newBooking = {
            code: bookingCode,
            fullname,
            phone: phoneFormatted,
            instagram: igHandle,
            places: ticketQty,
            total: totalAmount
        };

        // Déclencher l'envoi WhatsApp en arrière-plan
        sendWhatsAppNotification(newBooking).catch(err => {
            console.error("Erreur de notification WhatsApp :", err.message);
        });

        // Répondre au client
        res.status(201).json({
            success: true,
            booking: newBooking
        });
    } catch (err) {
        console.error("Erreur d'inscription :", err.message);
        res.status(500).json({ error: "Erreur lors de l'enregistrement de la réservation." });
    }
});

// 3. Authentification Admin Dashboard
app.post('/api/admin/auth', (req, res) => {
    const { password } = req.body;
    if (password === 'pinky2026') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: "Mot de passe incorrect." });
    }
});

// 4. Liste de toutes les réservations (Pour l'admin authentifié)
app.get('/api/bookings', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM reservations ORDER BY created_at DESC");
        const mapped = rows.map(r => ({
            code: r.code,
            // Convertir le timestamp UTC en date lisible en local
            date: new Date(r.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            name: r.fullname,
            phone: r.phone,
            instagram: r.instagram,
            qty: r.places,
            total: r.total,
            status: r.status
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Basculer le statut d'une réservation (Payé / En attente)
app.post('/api/bookings/toggle-status', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code requis." });

    try {
        const row = await dbGet("SELECT status FROM reservations WHERE code = ?", [code]);
        if (!row) return res.status(404).json({ error: "Réservation introuvable." });

        const newStatus = row.status === 'paid' ? 'pending' : 'paid';
        await dbRun("UPDATE reservations SET status = ? WHERE code = ?", [newStatus, code]);
        res.json({ success: true, newStatus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Supprimer une réservation
app.delete('/api/bookings/:code', async (req, res) => {
    const { code } = req.params;
    try {
        await dbRun("DELETE FROM reservations WHERE code = ?", [code]);
        res.json({ success: true, message: `Réservation ${code} supprimée.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Tout effacer (Reset de la base)
app.post('/api/bookings/clear-all', async (req, res) => {
    try {
        await dbRun("DELETE FROM reservations");
        res.json({ success: true, message: "Toutes les réservations ont été supprimées." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Visualiser le ticket et le QR Code pour un code donné
app.get('/ticket/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const row = await dbGet("SELECT * FROM reservations WHERE code = ?", [code]);
        if (!row) {
            return res.status(404).send("<h1 style='color: white; text-align: center; margin-top: 50px;'>Ticket introuvable</h1>");
        }
        
        const nameParts = row.fullname.split(' ');
        const prenom = nameParts[0] || '';
        const nom = nameParts.slice(1).join(' ') || row.fullname;
        
        const qrData = {
            "nom": nom,
            "prenom": prenom,
            "telephone": row.phone,
            "code": row.code,
            "places": parseInt(row.places),
            "date": "1er Juillet 2026 - 21h00"
        };
        
        const qrDataString = encodeURIComponent(JSON.stringify(qrData));
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrDataString}`;
        
        res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket d'entrée - ${row.code}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #070913;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .ticket-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 20, 147, 0.25);
            border-radius: 20px;
            padding: 30px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 20, 147, 0.15);
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 1.8rem;
            margin: 0 0 10px 0;
            letter-spacing: 2px;
            color: #ff1493;
            text-shadow: 0 0 10px rgba(255, 20, 147, 0.4);
        }
        .party-details {
            font-size: 0.9rem;
            color: #00d2ff;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 25px;
        }
        .qr-image {
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            margin: 20px auto;
            width: 200px;
            height: 200px;
            display: block;
        }
        .client-info {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            padding: 15px;
            text-align: left;
            font-size: 0.9rem;
            margin-top: 20px;
        }
        .client-info p {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
        }
        .client-info strong {
            color: #ffbd59;
        }
        .badge-code {
            background: rgba(255, 20, 147, 0.15);
            color: #ff1493;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        .footer-note {
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 25px;
        }
    </style>
</head>
<body>
    <div class="ticket-card">
        <h1>PINKY PARTY</h1>
        <div class="party-details">Pool Party • 1er Juillet 2026</div>
        
        <img class="qr-image" src="${qrImageUrl}" alt="QR Code d'entrée">
        
        <div class="client-info">
            <p><span>Nom & Prénom:</span> <strong>${row.fullname}</strong></p>
            <p><span>Téléphone:</span> <strong>${row.phone}</strong></p>
            <p><span>Instagram:</span> <strong>${row.instagram}</strong></p>
            <p><span>Nombre de Places:</span> <strong>${row.places}</strong></p>
            <p><span>Code Unique:</span> <span class="badge-code">${row.code}</span></p>
        </div>
        
        <div class="footer-note">Présentez ce QR code à l'entrée de la soirée.</div>
    </div>
</body>
</html>
        `);
    } catch (err) {
        res.status(500).send("<h1 style='color: white; text-align: center; margin-top: 50px;'>Erreur serveur</h1>");
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 SERVEUR PINKY PARTY DÉMARRÉ SUR LE PORT ${PORT}`);
    console.log(`🔗 Visitez : http://localhost:${PORT}`);
    console.log(`===================================================`);
});
