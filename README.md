# Projecte Fase 7 (EdgeEco)

EdgeEco és una plataforma pensada per administrar una xarxa de nodes de forma senzilla i consultar-ne les estadístiques en temps real. El sistema integra una base de dades local (SQLite) amb una interfície web mitjançant una API REST.

Ofereix la possibilitat de visualitzar tots els nodes sobre un mapa interactiu, registrar-ne de nous, actualitzar la seva informació i donar-los de baixa, tot protegit per un sistema d'autenticació segur.

---

## Com funciona?

El sistema accepta peticions HTTP per dur a terme les operacions d'administració:

* **GET:** Per consultar informació.
* **POST:** Per registrar dades o iniciar sessió.
* **PUT:** Per modificar registres existents.
* **DELETE:** Per eliminar informació.

qualsevol operació que alteri les dades exigeix un codi d'autorització (token JWT).

---

## Accés d'administrador

Per entrar al panell d'administració utilitza les credencials següents:

* **Email:** `admin@edgeeco.com`
* **Contrasenya:** `123456`

---

## Arquitectura del projecte

Node.js s'encarrega de l'API i de la comunicació amb la base de dades SQLite. Encara que no segueix un patró MVC estricte, el projecte té una estructura ben definida:

* `server.js`: Conté la configuració del servidor i totes les rutes de l'API.
* `db/db_init.php`: Encarregat de crear i inicialitzar la base de dades.
* `assets/js/script.js`: Gestiona la lògica del Frontend i les crides a l'API.
* `view/`: Directori on es troben les pàgines i vistes HTML.

---

## Preparació de l'entorn

instal·lar totes les dependències:

```bash
npm init -y
npm install express cors jsonwebtoken cookie-parser sqlite sqlite3 bcryptjs
npm install --save-dev nodemon
```

---

## Passos recomanats per engegar-lo

El projecte separa el Frontend (port 3000) de l'API (port 3001) per evitar conflictes de connexió. Segueix aquest ordre d'inici:

1. Instal·la les dependències:
```bash
npm install
```

2. Inicialitza la base de dades:
```bash
php db/db_init.php
```

3. Arrenca el servidor de l'API (port 3001):
```bash
npm run dev
```

4. Arrenca el servidor web (port 3000) en una terminal nova:
```bash
php -S localhost:3000
```

5. Accedeix a l'aplicació des del navegador: `http://localhost:3000/index.html`

---

## Codis de resposta

El servidor retorna un dels codis següents per informar de l'estat de cada petició:

| Codi | Significat | Què vol dir? |
|------|------------|--------------|
| 200 | D'acord (OK) | L'operació s'ha completat sense errors. |
| 201 | Creat | S'ha emmagatzemat un nou registre correctament. |
| 400 | Petició incorrecta | Hi mancaven dades o el format de la petició és erroni. |
| 401 | No autoritzat | La contrasenya no és vàlida o la sessió ha expirat. |
| 403 | Prohibit | S'ha intentat accedir a una acció protegida sense sessió activa. |
| 404 | No trobat | El node o recurs sol·licitat no existeix al sistema. |
| 500 | Error intern | S'ha produït una fallada al servidor o a la base de dades. |

---

## Peticions disponibles (Endpoints)

Totes les rutes de l'API es troben sota el prefix `/api`:

| Mètode | Direcció (Endpoint) | Què fa? |
|--------|---------------------|---------|
| POST | /api/login | Valida l'usuari i la contrasenya. Si són correctes, retorna un token vàlid durant 2 hores. |
| GET | /api/nodes | Retorna el llistat complet de tots els nodes registrats. |
| POST | /api/nodes | Afegeix un nou node al sistema. (Requereix sessió iniciada). |
| PUT | /api/nodes/:id | Actualitza les dades d'un node a partir del seu ID. (Requereix sessió iniciada). |
| DELETE | /api/nodes/:id | Elimina un node del sistema a partir del seu ID. (Requereix sessió iniciada). |

---

## Tecnologies i Llibreries utilitzades

Aquest projecte ha estat desenvolupat amb les eines següents:
* **express:** `^5.2.1` — Motor principal del servidor per gestionar les rutes de l'API.
* **cors:** `^2.8.6` — Facilita la comunicació segura entre el frontend i el servidor en ports separats.
* **Leaflet JS:** — Llibreria per representar el mapa interactiu i posicionar-hi els nodes.
* **jsonwebtoken:** `^9.0.3` — Crea i valida els tokens per protegir les accions d'administració.
* **cookie-parser:** `^1.4.7` — Processa les cookies rebudes al servidor per gestionar les sessions.
* **sqlite:** `^5.1.1` / **sqlite3:** `^5.1.6` — Gestiona la lectura i escriptura de dades amb suport per a operacions asíncrones.
* **bcryptjs:** `^3.0.3` — Xifra les contrasenyes per garantir la privacitat i seguretat dels usuaris.
* **nodemon:** — Reinicia el servidor automàticament en detectar canvis durant el desenvolupament.

---

Fet per Laura Pastó