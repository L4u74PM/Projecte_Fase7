
const API_URL = `${window.location.origin}/api/nodes`;
const API_LOGIN = `${window.location.origin}/api/login`;

// Elimina el token del navegador i redirigeix a l'inici per tancar la sessió
function tancarSessio() {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    
    alert("Sessió tancada correctament. Fins aviat!");
    window.location.href = 'index.html';
}

// Controla quins elements de la interfície es mostren segons el rol de l'usuari
function controlarAccessUI() {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const esAdmin = (token && rol === 'admin');

    const paginaActual = window.location.pathname;
    if (paginaActual.includes('alta.html') || paginaActual.includes('editar.html')) {
        if (!esAdmin) {
            alert('Accés denegat. Només per a administradors.');
            window.location.href = 'login.html'; 
        }
    }

    const linksNav = document.querySelectorAll('nav ul li a');
    
    linksNav.forEach(link => {
        const href = link.getAttribute('href');

        if (href === 'alta.html' && !esAdmin) {
            link.style.display = 'none'; 
        }

        if (href === 'login.html' || href === '#') { 
            if (esAdmin) {
                link.textContent = 'Sortir';
                link.href = '#'; 
                link.style.color = 'var(--danger)'; 
                
                const nouLink = link.cloneNode(true);
                link.parentNode.replaceChild(nouLink, link);
                
                nouLink.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    tancarSessio();
                });
            } else {
                link.textContent = 'Login';
                link.href = 'login.html';
                link.style.color = ''; 
            }
        }
    });
}

// Gestió del mode fosc/clar amb memòria al navegador
const toggleBtn = document.getElementById('dark-mode-toggle'); 

if (toggleBtn) {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        toggleBtn.textContent = 'Mode Fosc'; 
    } else {
        document.body.classList.remove('light-mode');
        toggleBtn.textContent = 'Mode Clar'; 
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        toggleBtn.textContent = isLight ? 'Mode Fosc' : 'Mode Clar';
    });
}

// Gestió de la llista de nodes, filtres i ordenació
let nodesData = [];

// Obté els dispositius des de l'API real (PHP) i els desa en memòria
async function carregarDispositivos() {
    const container = document.getElementById('dispositius-container');
    if (!container) return;

    try {
        const resposta = await fetch(API_URL);
        nodesData = await resposta.json();
        aplicarFiltres();
    } catch (error) {
        const container = document.getElementById('dispositius-container');
        container.innerHTML = "<p>Error en connectar amb la Base de Dades. Assegura't que el servidor està funcionant i que l'API és accessible.</p>";
    }
}

// Aplica els criteris de cerca i ordenació seleccionats per l'usuari
function aplicarFiltres() {
    const textCerca = document.getElementById('cerca-text')?.value.toLowerCase() || '';
    const tipusFiltre = document.getElementById('filtre-tipus')?.value || 'tots';
    const ordre = document.getElementById('ordre-noms')?.value || 'defecte';

    let resultat = nodesData.filter(d => {
        const coincideixText = d.nom.toLowerCase().includes(textCerca) || d.lloc.toLowerCase().includes(textCerca);
        const coincideixTipus = tipusFiltre === 'tots' || d.tipus === tipusFiltre;
        return coincideixText && coincideixTipus;
    });

    if (ordre === 'asc') {
        resultat.sort((a, b) => a.nom.localeCompare(b.nom));
    } else if (ordre === 'desc') {
        resultat.sort((a, b) => b.nom.localeCompare(a.nom));
    }

    renderitzarLlista(resultat);
    actualitzarCalculs(resultat);
}

// Dibuixa els elements filtrats al DOM
function renderitzarLlista(llista) {
    const container = document.getElementById('dispositius-container');
    const esAdmin = (localStorage.getItem('token') && localStorage.getItem('rol') === 'admin');

    if (llista.length === 0) {
        container.innerHTML = "<p>No s'han trobat nodes amb aquests criteris de cerca.</p>";
        return;
    }

    container.innerHTML = llista.map(d => `
        <article class="card">
            <h3>${d.nom}</h3>
            <p><strong>Ubicació:</strong> ${d.lloc}</p>
            <p><strong>Hardware:</strong> ${d.tipus || 'Estàndard'}</p>
            <p><strong>Responsable:</strong> ${d.email}</p>
            
            ${esAdmin ? `
            <div class="card-actions">
                <button class="btn-edit" onclick="obrirEdicio(${d.id})">Editar</button>
                <button class="btn-del" onclick="eliminarNode(${d.id})">Reciclar / Donar de baixa</button>
            </div>
            ` : ''} 
        </article>
    `).join('');
}

// Actualitza els comptadors de la pàgina de llista segons els elements visibles
function actualitzarCalculs(llista) {
    let co2Total = 0;
    let consumTotal = 0;

    llista.forEach(item => {
        if (item.tipus === 'reutilitzat') {
            co2Total += 15;
            consumTotal += 50;
        } else if (item.tipus === 'raspberry') {
            co2Total += 5;
            consumTotal += 5;
        } else {
            co2Total += 10;
            consumTotal += 20;
        }
    });

    const valItems = document.getElementById('total-items');
    const valCo2 = document.getElementById('total-co2-estalvi');
    const valConsum = document.getElementById('total-consum');

    if (valItems) valItems.innerText = llista.length;
    if (valCo2) valCo2.innerText = co2Total + " kg";
    if (valConsum) valConsum.innerText = consumTotal + " Wh";
}

// Elimina un node passant el token d'autorització i paràmetre per URL a PHP
async function eliminarNode(id) {
    const confirmacio = confirm("Estàs segur que vols reciclar aquest dispositiu?");

    if (confirmacio) {
        try {
            const token = localStorage.getItem('token'); 
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (resposta.ok) {
                carregarDispositivos();
            } else {
                const errDades = await resposta.json();
                alert(errDades.error || "No tens permisos per fer aquesta acció.");
            }
        } catch (error) {
            alert("No s'ha pogut processar la baixa.");
        }
    }
}

// Redirigeix a la pàgina d'edició amb l'ID seleccionat
function obrirEdicio(id) {
    window.location.href = `editar.html?id=${id}`;
}

// Carrega les dades existents i permet desar els canvis modificats a la BD real
async function inicialitzarPaginaEditar() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) return;

    try {
        const resposta = await fetch(`${API_URL}/${id}`);
        const d = await resposta.json();

        document.getElementById('edit-id').value = d.id;
        document.getElementById('edit-nom').value = d.nom;
        document.getElementById('edit-lloc').value = d.lloc;
        document.getElementById('edit-tipus').value = d.tipus;
        document.getElementById('edit-email').value = d.email;

    } catch (error) {
        console.error("Error en carregar dades del node:", error);
    }

    const form = document.getElementById('form-editar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const lloc = document.getElementById('edit-lloc').value.trim();
            const coords = CIUDADES_COORDS[lloc];

            const dadesModificades = {
                nom: document.getElementById('edit-nom').value.trim(),
                lloc: lloc,
                tipus: document.getElementById('edit-tipus').value,
                email: document.getElementById('edit-email').value.trim(),
                lat: coords ? coords.lat : 41.7,
                lng: coords ? coords.lng : 1.5
            };

            // XIVAT: Mostrem per consola què estem a punt d'enviar per comprovar que no estigui buit
            console.log("Dades que s'enviaran al PHP:", dadesModificades);

            const token = localStorage.getItem('token'); 
            
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(dadesModificades)
            });

            if (resposta.ok) {
                const missatgeEstat = document.getElementById('missatge-estat');
                missatgeEstat.className = "success-box";
                missatgeEstat.innerText = "Canvis guardats a la Base de Dades. Redirigint...";
                
                localStorage.setItem('nodesUpdated', Date.now());
                
                setTimeout(() => {
                    window.location.href = 'llista.html';
                }, 1500);
            } else {
                const errorData = await resposta.json();
                document.getElementById('edit-error').textContent = errorData.error || 'Error en guardar els canvis.';
            }
        } catch (error) {
            console.error("Error en actualitzar el node:", error);
            document.getElementById('edit-error').textContent = "S'ha produït un error de connexió.";
        }
    });
}

// coordenades per ciutat
const CIUDADES_COORDS = {
    'Barcelona': { lat: 41.3851, lng: 2.1734 },
    'Girona': { lat: 41.9857, lng: 2.8038 },
    'Tarragona': { lat: 41.1183, lng: 1.2440 },
    'Lleida': { lat: 41.6149, lng: 0.6294 },
    'Manresa': { lat: 41.7311, lng: 1.8343 },
    'Terrassa': { lat: 41.5629, lng: 2.0147 },
    'Sabadell': { lat: 41.5454, lng: 2.1155 },
    'Mataró': { lat: 41.5371, lng: 2.4475 },
    'Reus': { lat: 41.1567, lng: 1.1058 },
    'Salt': { lat: 41.9980, lng: 2.8159 }
};

// Introdueix un lleuger desplaçament a les coordenades per evitar solapaments exactes al mapa
const moverCoordenada = (num) => num + (Math.random() - 0.5) * 0.01;

// Configura l'enviament del formulari per crear un nou node a la BD real
function inicialitzarFormulariAlta() {
    const form = document.getElementById('form-alta');
    const missatgeEstat = document.getElementById('missatge-estat');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const lloc = document.getElementById('lloc').value.trim();
        const coords = CIUDADES_COORDS[lloc];

        const finalLat = coords ? moverCoordenada(coords.lat) : 41.7;
        const finalLng = coords ? moverCoordenada(coords.lng) : 1.5;

        const nouNode = {
            nom: document.getElementById('nom').value.trim(),
            lloc: lloc,
            tipus: document.getElementById('tipus').value,
            email: document.getElementById('email').value.trim(),
            lat: Number(finalLat.toFixed(6)),
            lng: Number(finalLng.toFixed(6))
        };

        try {
            const token = localStorage.getItem('token'); 
            const resposta = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(nouNode)
            });

            const resultat = await resposta.json();

            if (resposta.ok) {
                missatgeEstat.className = "success-box";
                missatgeEstat.innerText = "Node registrat correctament a la Base de Dades.";
                form.reset();
            } else {
                missatgeEstat.className = "error-box";
                missatgeEstat.innerText = "Error: " + (resultat.error || "No s'ha pogut fer l'alta.");
            }
        } catch (error) {
            console.error("Error en fer el POST:", error);
            missatgeEstat.className = "error-box";
            missatgeEstat.innerText = "Error de connexió amb el servidor Node.js.";
        }
    });
}

// Obté els nodes de l'API real i els dibuixa sobre el mapa de Leaflet
async function carregarMapaNodes() {
    // Comprova si existeix el contenidor del mapa a la pàgina; si no hi és, cancel·la l'execució
    const mapContainer = document.getElementById('network-map');
    if (!mapContainer) return;

    try {
        // Petició asíncrona per obtenir el llistat de nodes del servidor
        const resposta = await fetch(API_URL); 
        const nodes = await resposta.json();

        // Si la resposta està buida, mostra un missatge 
        if (nodes.length === 0) {
            mapContainer.innerHTML = "<p>No hi ha nodes actius per mostrar al mapa.</p>";
            return;
        }

        // Neteja el text o contingut previ del contenidor abans d'instanciar el mapa
        mapContainer.innerHTML = '';
        // Inicialitza el mapa de Leaflet centrat a Catalunya
        const map = L.map('network-map').setView([41.7, 1.5], 8);

        // Afegeix la capa de mapes
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            className: 'map-tiles'
        }).addTo(map);

        //quantes cordenades iguals hi ha
        const samePositionIndex = {};

        function ajustarPosicio(lat, lng) {
            // Crea una clau única de text limitant a 6 decimals per identificar la posició
            const key = `${lat.toFixed(6)}|${lng.toFixed(6)}`;
            const index = samePositionIndex[key] || 0;
            samePositionIndex[key] = index + 1;

            if (index === 0) return [lat, lng];

            // Calcula un angle i un radi en espiral per separar els marcadors consecutius
            const angle = (index - 1) * 45;
            const radius = 0.00025 + (Math.floor((index - 1) / 8) * 0.0002);
            const radian = angle * Math.PI / 180;
            
           
            return [
                lat + Math.sin(radian) * radius,
                lng + Math.cos(radian) * radius
            ];
        }

        // Recorre la llista de nodes per processar-los i colocar-los al mapa
        nodes.forEach(node => {
            // Només es processen els nodes que disposen de coordenades vàlides
            if (node.lat && node.lng) {
                
                // Determina el color del marcador segons la propietat 'tipus' del node
                const markerColor = node.tipus === 'reutilitzat' ? '#66BB6A' : 
                                   node.tipus === 'raspberry' ? '#42A5F5' : '#FFA726';

                // Aplica el desplaçament en cas que hi hagi dos elements al mateix punt
                const [adjLat, adjLng] = ajustarPosicio(node.lat, node.lng);

                // Crea un element visual HTML 
                const customIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 12px;">●</span>
                    </div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15], // Centra la icona directament sobre la coordenada
                    popupAnchor: [0, -15] // Ajusta la posició on sortira el text
                });

                // Instancia el marcador de Leaflet a la posició calculada i el vincula al mapa
                const marker = L.marker([adjLat, adjLng], { icon: customIcon }).addTo(map);
                
                // Associa una bafarada emergent al marcador amb informació detallada en format HTML
                marker.bindPopup(`
                    <div style="text-align: center; min-width: 200px;">
                        <strong>${node.nom}</strong><br>
                        <small>📍 ${node.lloc}</small><br>
                        <small> Tipus: ${node.tipus || 'Estàndard'}</small><br>
                        <small> Correu: ${node.email}</small>
                    </div>
                `);
            }
        });
        
        // Neteja una possible marca o bandera
        localStorage.removeItem('nodesUpdated');
        
    } catch (error) {
        console.error("Error al carregar el mapa:", error);
        mapContainer.innerHTML = "<p>Error en connectar amb el servidor.</p>";
    }
}
// Extreu dades globals de l'API real i actualitza els gràfics de barres

async function generarEstadistiques() {
    try {
        const resposta = await fetch(API_URL);
        const dades = await resposta.json();
        const numNodes = dades.length;

        document.getElementById('total-nodes').innerText = numNodes;
        // Calcula el CO2 total (suposant 5.2 unitats per node) i el mostra amb un decimal
        document.getElementById('total-co2').innerText = (numNodes * 5.2).toFixed(1);

        const reutilitzats = dades.filter(d => d.tipus === 'reutilitzat').length;
        
        // Calcula el percentatge de nodes reutilitzats
        const percentatgeReu = numNodes > 0 ? (reutilitzats / numNodes * 100) : 0;
        // El percentatge restant s'assigna als nodes 'lowpower'
        const pLow = numNodes > 0 ? 100 - percentatgeReu : 0;

        // Retardem l'actualització visual de les barres de progrés
       
        setTimeout(() => {
            // Modifica l'amplada i el text de la barra de nodes reutilitzats
            const barReu = document.getElementById('bar-reutilitzat');
            barReu.style.width = percentatgeReu + '%';
            barReu.innerText = percentatgeReu.toFixed(0) + '%'; // Mostra el percentatge sense decimals

            // Modifica l'amplada i el text de la barra de nodes 'lowpower'
            const barLow = document.getElementById('bar-lowpower');
            barLow.style.width = pLow + '%';
            barLow.innerText = pLow.toFixed(0) + '%'; // Mostra el percentatge sense decimals
        }, 300);

    } catch (error) {
        console.error("Error al carregar estadístiques", error);
    }
}
// Inicialització d'esdeveniments un cop l'HTML ha carregat completament
document.addEventListener('DOMContentLoaded', () => {
    controlarAccessUI();

    const formAlta = document.getElementById('form-alta');
    if (formAlta) inicialitzarFormulariAlta();

    const formEditar = document.getElementById('form-editar');
    if (formEditar) inicialitzarPaginaEditar();

    const formSimulador = document.getElementById('form-simulador');
    if (formSimulador) {
        formSimulador.addEventListener('submit', (e) => {
            e.preventDefault();
            const gb   = parseFloat(document.getElementById('dades-gb').value);
            const dist = parseInt(document.getElementById('distancia').value);
            const co2Cloud = (gb * 0.5 * (dist / 1000)).toFixed(2);
            const co2Edge  = (gb * 0.1).toFixed(2);
            const estalvi  = (((co2Cloud - co2Edge) / co2Cloud) * 100).toFixed(0);
            
            document.getElementById('resultats-simulacio').style.display = 'grid';
            document.getElementById('estalvi-total').style.display = 'block';
            document.getElementById('cloud-co2').innerHTML = `<strong>${co2Cloud} kg CO2</strong>`;
            document.getElementById('edge-co2').innerHTML  = `<strong>${co2Edge} kg CO2</strong>`;
            document.getElementById('percentatge-text').innerText = `Estalvi del ${estalvi}% en emissions!`;
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });
    }

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('user-email').value.trim();
            const pass  = document.getElementById('password').value;
            
            if (!email || !pass) {
                alert('Omple tots els camps.');
                return;
            }

            try {
                const resposta = await fetch(API_LOGIN, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pass })
                });

                const dades = await resposta.json();

                if (resposta.ok) {
                    localStorage.setItem('token', dades.token);
                    localStorage.setItem('rol', dades.rol);

                    alert("Benvingut/da, administrador/a. Sessió iniciada.");
                    window.location.href = 'llista.html';
                } else {
                    alert(dades.error || "Credencials incorrectes.");
                }
            } catch (error) {
                console.error("Error al iniciar sessió:", error);
                alert("Error de connexió amb el servidor Node.js.");
            }
        });
    }

    if (document.getElementById('total-nodes')) {
        generarEstadistiques();
    }

    if (document.getElementById('dispositius-container')) {
        document.getElementById('cerca-text')?.addEventListener('input', aplicarFiltres);
        document.getElementById('filtre-tipus')?.addEventListener('change', aplicarFiltres);
        document.getElementById('ordre-noms')?.addEventListener('change', aplicarFiltres);
        carregarDispositivos();
    }

    if (document.getElementById('network-map')) {
        carregarMapaNodes();
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && document.getElementById('network-map')) {
                if (localStorage.getItem('nodesUpdated')) {
                    carregarMapaNodes();
                }
            }
        });
    }
});