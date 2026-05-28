
const express = require('express'); 
const cors = require('cors'); // Permetre sol·licituds cross-origin
const path = require('path'); 
const jwt = require('jsonwebtoken'); // Generar i verificar tokens JWT
const sqlite3 = require('sqlite3').verbose(); // Base de dades SQLite
const bcrypt = require('bcryptjs'); // Hash segur de contrasenyes

const app = express();
const PORT = 3000; 
const DB_FILE = path.join(__dirname, 'db', 'nodes.db'); 
const SECRET_KEY = 'ClaveSecretaSuperSeguraDeEdgeEco'; // Clau per signar tokens JWT 

// Configurar CORS
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://localhost', 
        'http://127.0.0.1'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true 
}));


app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'view')));

// Connectar a la base de dades SQLite
// Si el fitxer no existeix, SQLite la crearà automàticament
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) console.error('Error al obrir la base de dades:', err.message);
    else console.log('Base de dades SQLite connectada correctament.');
});

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(403).json({ error: 'Accés denegat. Es requereix un token.' });
    }

    // Verificar que el token sigui vàlid i no estigui expirat
    jwt.verify(token, SECRET_KEY, (err, usuario) => {
        if (err) return res.status(401).json({ error: 'Token invàlid o expirat.' });
        req.usuario = usuario; // Guardar dades de l'usuari a la petició
        next(); 
    });
};

// Autenticació d'usuaris
app.post('/api/login', (req, res) => {
    const { email, password } = req.body; 

    // Buscar l'usuari a la base de dades
    db.get(`SELECT * FROM usuaris WHERE correu = ?`, [email], async (err, row) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        
        // Verificar si l'usuari existeix
        if (!row) return res.status(401).json({ error: 'Credencials incorrectes' });

        // Comparar la contrasenya introduïda amb la db
        const passwordValida = await bcrypt.compare(password, row.contrasenya);
        
        if (!passwordValida) return res.status(401).json({ error: 'Credencials incorrectes' });

        // Si l'autenticació és correcta, generar un JWT vàlid per a 2 hores
        const payload = { usuari: row.correu, rol: 'admin' };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });

        return res.json({ 
            missatge: 'Autenticació correcta', 
            token: token,
            rol: 'admin'
        });
    });
});

// Gestió de nodes

// Obtenir llista de tots els nodes
app.get('/api/nodes', (req, res) => {
    db.all(`SELECT * FROM nodes`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Crear un nou node
app.post('/api/nodes', verificarToken, (req, res) => {
    // Extreure dades del node, amb valors per defecte per a coordenades
    const { nom, lloc, tipus, email, lat = 41.7, lng = 1.5 } = req.body;
    
    db.run(`INSERT INTO nodes (nom, lloc, tipus, email, lat, lng) VALUES (?, ?, ?, ?, ?, ?)`, 
        [nom, lloc, tipus, email, lat, lng], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ 
                missatge: 'Node creat correctament', 
                id: this.lastID, nom, lloc, tipus, email, lat, lng 
            });
        }
    );
});

// Actualitzar dades d'un node
app.put('/api/nodes/:id', verificarToken, (req, res) => {
    const { nom, lloc, tipus, email, lat, lng } = req.body;
    const id = parseInt(req.params.id);

    db.run(`UPDATE nodes SET nom=?, lloc=?, tipus=?, email=?, lat=?, lng=? WHERE id=?`, 
        [nom, lloc, tipus, email, lat, lng, id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Node no trobat' });
            res.json({ missatge: 'Node actualitzat correctament' });
        }
    );
});

// Eliminar un node
app.delete('/api/nodes/:id', verificarToken, (req, res) => {
    const id = parseInt(req.params.id);

    db.run(`DELETE FROM nodes WHERE id=?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Node no trobat' });
        res.json({ missatge: 'Node eliminat correctament' });
    });
});

// Iniciar el servidor en el port especificat
app.listen(PORT, () => {
    console.log(`API executant-se a http://localhost:${PORT}`);
    console.log(`  Base de dades: ${DB_FILE}`);
});