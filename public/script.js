const TICKET_PRICE = 80; // Price in DT
const ADMIN_PASSWORD_HASH = "pinky2026"; // Organizer password
const MAX_PLACES = 50; // Maximum party capacity limit

// ==========================================
// DOM ELEMENTS
// ==========================================
// Gateway Elements
const welcomeGate = document.getElementById('welcome-gate');
const btnEnter = document.getElementById('btn-enter');
const mainContentWrapper = document.getElementById('main-content-wrapper');

// Music & Background Elements
const musicBtn = document.getElementById('music-btn');
const musicVisualizer = document.querySelector('.music-visualizer');
const musicStatus = document.querySelector('.music-status');
const bg3DContainer = document.getElementById('bg-3d-container');

// YouTube Hidden Player Configuration
let ytPlayer;
let ytPlaylist = ['tzDSr6VJNzQ', 'HI6gMkfRjE0']; // Afro House Playlist played in sequence
let currentTrackIndex = 0;
let ytPlayerReady = false;

// Dynamically load YouTube Player API script
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// YouTube API globally exposed callback
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player', {
        height: '1',
        width: '1',
        videoId: ytPlaylist[currentTrackIndex],
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'loop': 1,
            'playlist': ytPlaylist.join(',')
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerReady(event) {
    ytPlayerReady = true;
    ytPlayer.setVolume(100);
    // If the gate is already entered, play immediately
    if (welcomeGate.classList.contains('fade-out')) {
        ytPlayer.playVideo();
    }
}

function onPlayerStateChange(event) {
    // 0 represents ended
    if (event.data === 0) {
        playNextTrack();
    }
}

function playNextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % ytPlaylist.length;
    if (ytPlayer && ytPlayerReady) {
        ytPlayer.loadVideoById(ytPlaylist[currentTrackIndex]);
        musicVisualizer.classList.remove('paused');
        musicStatus.innerText = "Mute 🔇";
    }
}

// Form & Booking Elements
const bookingForm = document.getElementById('booking-form');
const ticketQtySelect = document.getElementById('ticket-qty');
const totalPriceEl = document.getElementById('total-price');
const bookingCardContent = document.getElementById('booking-card-content');
const bookingSuccessDiv = document.getElementById('booking-success');

// Success Screen Elements
const successCodeEl = document.getElementById('success-code');
const successQtyEl = document.getElementById('success-qty');
const successTotalEl = document.getElementById('success-total');
const btnSuccessWhatsapp1 = document.getElementById('btn-success-whatsapp-1');
const btnSuccessWhatsapp2 = document.getElementById('btn-success-whatsapp-2');
const btnReset = document.getElementById('btn-reset');

// Admin Elements
const linkAdmin = document.getElementById('link-admin');
const adminModal = document.getElementById('admin-modal');
const adminClose = document.getElementById('admin-close');
const adminAuthSection = document.getElementById('admin-auth-section');
const adminDashboardSection = document.getElementById('admin-dashboard-section');
const adminPasswordInput = document.getElementById('admin-password');
const btnAdminAuth = document.getElementById('btn-admin-auth');
const authError = document.getElementById('auth-error');
const bookingsList = document.getElementById('bookings-list');
const searchInput = document.getElementById('search-input');
const btnExportCSV = document.getElementById('btn-export-csv');
const btnClearAll = document.getElementById('btn-clear-all');

// 3D Tilt Container Element
const tiltContainer = document.getElementById('tilt-container');

// Les effets d'interaction souris 3D ont été désactivés pour un rendu statique ultra-pro et stable.

// ==========================================
// GATEWAY & MUSIC AUTOPLAY RESOLUTION
// ==========================================
btnEnter.addEventListener('click', () => {
    // Start YouTube video playback (Validates user interaction in browser)
    if (ytPlayer && ytPlayerReady) {
        try {
            ytPlayer.playVideo();
            musicVisualizer.classList.remove('paused');
            musicStatus.innerText = "Mute 🔇";
        } catch (err) {
            console.log("YouTube autoplay failed: ", err);
        }
    }

    // Fade out introduction portal
    welcomeGate.classList.add('fade-out');

    // Display page content with 3D entry animation
    mainContentWrapper.classList.remove('hidden-content');
    
    // Launch dynamic sparkle background animations
    initSparkles();
});

// Manual Mute/Play Toggle
function toggleMusic() {
    if (!ytPlayer || !ytPlayerReady) return;
    
    try {
        const state = ytPlayer.getPlayerState();
        // 1 means PLAYING, otherwise paused or not playing
        if (state === 1) {
            ytPlayer.pauseVideo();
            musicVisualizer.classList.add('paused');
            musicStatus.innerText = "Play Music 🎵";
        } else {
            ytPlayer.playVideo();
            musicVisualizer.classList.remove('paused');
            musicStatus.innerText = "Mute 🔇";
        }
    } catch (err) {
        console.log("Music toggle failed: ", err);
    }
}

musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
});

// Fallback background trigger just in case they bypass welcome gate
document.addEventListener('click', () => {
    if (ytPlayer && ytPlayerReady && welcomeGate.classList.contains('fade-out')) {
        try {
            const state = ytPlayer.getPlayerState();
            if (state !== 1) {
                ytPlayer.playVideo();
                musicVisualizer.classList.remove('paused');
                musicStatus.innerText = "Mute 🔇";
            }
        } catch (err) {}
    }
}, { once: true });

// ==========================================
// PRICE CALCULATION LOGIC
// ==========================================
ticketQtySelect.addEventListener('change', () => {
    const qty = parseInt(ticketQtySelect.value);
    const total = qty * TICKET_PRICE;
    totalPriceEl.innerText = `${total} DT`;
});

// ==========================================
// BOOKING FORM SUBMISSION (CONNECTÉ BACKEND)
// ==========================================
bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullname = document.getElementById('user-fullname').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    let instagram = document.getElementById('user-instagram').value.trim();
    const qty = parseInt(ticketQtySelect.value);

    // Standardiser le format instagram
    if (!instagram.startsWith('@')) {
        instagram = `@${instagram}`;
    }

    // Soumission de la réservation au serveur Express
    fetch('/api/reserve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fullname,
            phone,
            instagram,
            places: qty
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(data => {
                throw new Error(data.error || "Une erreur est survenue.");
            });
        }
        return res.json();
    })
    .then(data => {
        const booking = data.booking;

        // Mettre à jour le compteur immédiatement
        updateCapacityCounter();

        // Remplir l'écran de succès
        successCodeEl.innerText = booking.code;
        successQtyEl.innerText = booking.places;
        successTotalEl.innerText = booking.total;

        // Générer le QR Code unique de réservation
        const qrcodeEl = document.getElementById('qrcode');
        if (qrcodeEl) {
            qrcodeEl.innerHTML = ''; // Clear previous QR Code if any
            
            // Extraire le prénom et le nom
            const nameParts = fullname.split(' ');
            const prenom = nameParts[0] || '';
            const nom = nameParts.slice(1).join(' ') || fullname;

            const qrData = {
                "nom": nom,
                "prenom": prenom,
                "telephone": phone,
                "code": booking.code,
                "places": parseInt(booking.places),
                "date": "1er Juillet 2026 - 21h00"
            };

            try {
                new QRCode(qrcodeEl, {
                    text: JSON.stringify(qrData),
                    width: 128,
                    height: 128,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            } catch (qrErr) {
                console.error("Erreur lors de la génération du QR Code:", qrErr);
            }
        }

        // Activer l'arrière-plan de confirmation
        if (bg3DContainer) {
            bg3DContainer.classList.add('success-active');
        }

        // Configurer les URLs WhatsApp de confirmation
        const nameParts = fullname.split(' ');
        const prenom = nameParts[0] || '';
        const nom = nameParts.slice(1).join(' ') || fullname;

        const qrData = {
            "nom": nom,
            "prenom": prenom,
            "telephone": phone,
            "code": booking.code,
            "places": parseInt(booking.places),
            "date": "1er Juillet 2026 - 21h00"
        };
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}`;

        const whatsappMsg = encodeURIComponent(
            `Salut ! Je viens d'enregistrer ma réservation pour la soirée Pinky Party.\n\n` +
            `• Code Booking : ${booking.code}\n` +
            `• Nom : ${booking.fullname}\n` +
            `• Instagram : ${booking.instagram}\n` +
            `• Nombre de place(s) : ${booking.places}\n` +
            `• Total : ${booking.total}\n\n` +
            `🔗 Mon QR Code d'entrée : ${qrImageUrl}\n\n` +
            `Ci-joint la capture d'écran de mon règlement.`
        );
        btnSuccessWhatsapp1.href = `https://wa.me/21692711794?text=${whatsappMsg}`;
        btnSuccessWhatsapp2.href = `https://wa.me/21658520774?text=${whatsappMsg}`;

        // Changer de vue
        bookingForm.classList.add('hidden');
        bookingSuccessDiv.classList.remove('hidden');

        bookingCardContent.scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => {
        alert(err.message);
    });
});

btnReset.addEventListener('click', () => {
    bookingForm.reset();
    totalPriceEl.innerText = `${TICKET_PRICE} DT`;
    bookingForm.classList.remove('hidden');
    bookingSuccessDiv.classList.add('hidden');

    // Réinitialiser l'arrière-plan 3D
    if (bg3DContainer) {
        bg3DContainer.classList.remove('success-active');
    }
    // Nettoyer le QR Code
    const qrcodeEl = document.getElementById('qrcode');
    if (qrcodeEl) {
        qrcodeEl.innerHTML = '';
    }
});

// ==========================================
// ADMIN DASHBOARD & AUTH (CONNECTÉ BACKEND)
// ==========================================
linkAdmin.addEventListener('click', (e) => {
    e.preventDefault();
    adminModal.classList.remove('hidden');
    adminPasswordInput.focus();
    
    // Si l'utilisateur est déjà connecté dans cette session, ignorer l'étape de connexion
    if (sessionStorage.getItem('pinky_admin_auth') === 'true') {
        adminAuthSection.classList.add('hidden');
        adminDashboardSection.classList.remove('hidden');
        loadAdminBookings();
    }
});

adminClose.addEventListener('click', () => {
    adminModal.classList.add('hidden');
    resetAdminPortal();
});

function resetAdminPortal() {
    adminPasswordInput.value = '';
    authError.classList.add('hidden');
    // Conserver la session mais masquer les vues si l'utilisateur ferme le modal
    if (sessionStorage.getItem('pinky_admin_auth') !== 'true') {
        adminAuthSection.classList.remove('hidden');
        adminDashboardSection.classList.add('hidden');
    }
}

btnAdminAuth.addEventListener('click', performAdminAuth);
adminPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performAdminAuth();
});

function performAdminAuth() {
    const pass = adminPasswordInput.value;
    
    fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
    })
    .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    })
    .then(data => {
        if (data.success) {
            sessionStorage.setItem('pinky_admin_auth', 'true');
            adminAuthSection.classList.add('hidden');
            adminDashboardSection.classList.remove('hidden');
            loadAdminBookings();
        }
    })
    .catch(() => {
        authError.classList.remove('hidden');
    });
}

function loadAdminBookings() {
    fetch('/api/bookings')
    .then(res => res.json())
    .then(bookings => {
        renderBookingsTable(bookings);
    })
    .catch(err => console.error("Erreur de chargement :", err));
}

function renderBookingsTable(bookingsListArray) {
    bookingsList.innerHTML = '';

    if (bookingsListArray.length === 0) {
        bookingsList.innerHTML = `<tr><td colspan="9" class="no-bookings">Aucune réservation pour le moment.</td></tr>`;
        return;
    }

    bookingsListArray.forEach((booking) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.date}</td>
            <td><strong style="color: #ff1493;">${booking.code}</strong></td>
            <td>${escapeHtml(booking.name)}</td>
            <td><a href="tel:${booking.phone}" style="color: inherit; text-decoration: none;">${booking.phone}</a></td>
            <td>
                <a href="https://instagram.com/${escapeHtml(booking.instagram.replace('@', ''))}" target="_blank" style="color: #00d2ff; text-decoration: none;">
                     <i class="fa-brands fa-instagram"></i> ${escapeHtml(booking.instagram)}
                </a>
            </td>
            <td>${booking.qty}</td>
            <td><strong>${booking.total}</strong></td>
            <td>
                <span class="status-badge ${booking.status}" onclick="toggleBookingStatus('${booking.code}')">
                    ${booking.status === 'paid' ? 'Payé' : 'En attente'}
                </span>
            </td>
            <td>
                <button class="btn-icon-only" onclick="deleteBooking('${booking.code}')" title="Supprimer">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        bookingsList.appendChild(row);
    });
}

function triggerSearchRefresh() {
    const query = searchInput.value.toLowerCase();
    
    fetch('/api/bookings')
    .then(res => res.json())
    .then(allBookings => {
        const filtered = allBookings.filter(booking => 
            booking.name.toLowerCase().includes(query) || 
            booking.phone.includes(query) ||
            booking.code.toLowerCase().includes(query) ||
            (booking.instagram && booking.instagram.toLowerCase().includes(query))
        );
        renderBookingsTable(filtered);
    })
    .catch(err => console.error(err));
}

searchInput.addEventListener('input', triggerSearchRefresh);

window.toggleBookingStatus = function(code) {
    fetch('/api/bookings/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            triggerSearchRefresh();
        }
    })
    .catch(err => console.error(err));
};

window.deleteBooking = function(code) {
    if (confirm(`Voulez-vous vraiment supprimer la réservation ${code} ?`)) {
        fetch(`/api/bookings/${code}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                triggerSearchRefresh();
                updateCapacityCounter();
            }
        })
        .catch(err => console.error(err));
    }
};

btnClearAll.addEventListener('click', () => {
    if (confirm("ATTENTION ! Voulez-vous supprimer TOUTES les réservations ? Cette action est irréversible.")) {
        fetch('/api/bookings/clear-all', {
            method: 'POST'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadAdminBookings();
                updateCapacityCounter();
            }
        })
        .catch(err => console.error(err));
    }
});

btnExportCSV.addEventListener('click', () => {
    fetch('/api/bookings')
    .then(res => res.json())
    .then(bookings => {
        if (bookings.length === 0) {
            alert("Aucune réservation à exporter.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Date,Code Booking,Nom & Prenom,Telephone,Instagram,Places,Total,Statut\n";

        bookings.forEach(b => {
            const row = [
                `"${b.date}"`,
                `"${b.code}"`,
                `"${escapeCsv(b.name)}"`,
                `"${b.phone}"`,
                `"${b.instagram || 'N/A'}"`,
                b.qty,
                `"${b.total}"`,
                `"${b.status === 'paid' ? 'Paye' : 'En attente'}"`
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reservations_pinky_party_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    })
    .catch(err => console.error(err));
});

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function escapeCsv(text) {
    if (!text) return '';
    return text.replace(/"/g, '""');
}

// ==========================================
// DYNAMIC FLOATING SPARKLES GENERATION
// ==========================================
function initSparkles() {
    if (!tiltContainer) return;
    
    const particlesCount = 20;
    for (let i = 0; i < particlesCount; i++) {
        createSingleSparkle(true);
    }
    
    setInterval(() => {
        createSingleSparkle(false);
    }, 800);
}

function createSingleSparkle(randomizeY) {
    if (!tiltContainer) return;
    
    const sparkle = document.createElement('div');
    sparkle.classList.add('particle-sparkle');
    
    const size = Math.random() * 4 + 2;
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    
    sparkle.style.left = `${Math.random() * 100}%`;
    
    if (randomizeY) {
        sparkle.style.bottom = `${Math.random() * 100}%`;
    } else {
        sparkle.style.bottom = `-10px`;
    }
    
    const duration = Math.random() * 8 + 8;
    const delay = randomizeY ? -Math.random() * duration : 0;
    
    sparkle.style.animationDuration = `${duration}s`;
    sparkle.style.animationDelay = `${delay}s`;
    
    const drift = (Math.random() * 80 - 40).toFixed(0);
    sparkle.style.setProperty('--drift-x', `${drift}px`);
    
    tiltContainer.appendChild(sparkle);
    
    setTimeout(() => {
        sparkle.remove();
    }, (duration + (randomizeY ? 0 : 0)) * 1000);
}

// ==========================================
// MANAGEMENT DE CAPACITÉ (CONNECTÉ BACKEND)
// ==========================================
function updateCapacityCounter() {
    fetch('/api/stats')
    .then(res => res.json())
    .then(data => {
        const remaining = data.remaining;
        const maxPlaces = data.maxPlaces;
        
        const placesLeftEl = document.getElementById('places-left');
        const barFillEl = document.getElementById('places-bar-fill');
        const submitBtn = document.getElementById('btn-submit');
        
        if (placesLeftEl) {
            placesLeftEl.innerText = `${remaining} / ${maxPlaces}`;
        }
        
        if (barFillEl) {
            const fillPercentage = (remaining / maxPlaces) * 100;
            barFillEl.style.width = `${fillPercentage}%`;
            
            if (fillPercentage > 50) {
                barFillEl.style.background = 'var(--gradient-pink-blue)';
            } else if (fillPercentage > 20) {
                barFillEl.style.background = 'var(--accent-gold)';
            } else {
                barFillEl.style.background = '#e53e3e';
            }
        }
        
        if (remaining <= 0) {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>ÉVÉNEMENT COMPLET ❌</span>';
                submitBtn.style.background = 'rgba(255, 255, 255, 0.05)';
                submitBtn.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.style.boxShadow = 'none';
            }
        } else {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>PASSER LA RÉSERVATION & PAYER (Cash / e-Dinar)</span>';
                submitBtn.style.background = 'var(--gradient-gold-pink)';
                submitBtn.style.border = 'none';
                submitBtn.style.cursor = 'pointer';
                submitBtn.style.boxShadow = '0 4px 15px rgba(255, 20, 147, 0.3)';
            }
        }
    })
    .catch(err => console.error("Erreur de mise à jour de la capacité :", err));
}

// Lancement au chargement de la page
updateCapacityCounter();

// ==========================================
// COMING SOON COUNTDOWN TIMER
// ==========================================
function initCountdown() {
    const eventDate = new Date('2026-07-01T18:00:00');

    function tick() {
        const now = new Date();
        const diff = eventDate - now;

        if (diff <= 0) {
            document.getElementById('cd-days').innerText  = '00';
            document.getElementById('cd-hours').innerText = '00';
            document.getElementById('cd-mins').innerText  = '00';
            return;
        }

        const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        document.getElementById('cd-days').innerText  = String(days).padStart(2, '0');
        document.getElementById('cd-hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('cd-mins').innerText  = String(mins).padStart(2, '0');
    }

    tick();
    setInterval(tick, 30000); // update every 30 seconds
}

initCountdown();

// ==========================================
// AUTO-LAUNCH ADMIN DASHBOARD VIA URL HASH (#admin)
// ==========================================
function checkAdminHash() {
    if (window.location.hash === '#admin') {
        if (typeof adminModal !== 'undefined' && adminModal) {
            adminModal.classList.remove('hidden');
            if (typeof adminPasswordInput !== 'undefined' && adminPasswordInput) {
                adminPasswordInput.focus();
            }
            if (sessionStorage.getItem('pinky_admin_auth') === 'true') {
                if (typeof adminAuthSection !== 'undefined') adminAuthSection.classList.add('hidden');
                if (typeof adminDashboardSection !== 'undefined') adminDashboardSection.classList.remove('hidden');
                if (typeof loadAdminBookings === 'function') loadAdminBookings();
            }
        }
    }
}

// Écouter le chargement de la page et les changements de hash
window.addEventListener('DOMContentLoaded', checkAdminHash);
window.addEventListener('hashchange', checkAdminHash);



