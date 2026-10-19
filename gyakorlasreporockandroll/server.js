const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "szerviz_db",
    connectionLimit: 10
});

// Összes jármű tulajdonos nevével
app.get("/jarmuvek", (req, res) => {
    const sql = `
        SELECT
            j.id,
            j.rendszam,
            j.modell,
            j.javitasi_koltseg,
            j.kesz_van,
            t.nev AS tulajdonos_nev
        FROM jarmuvek j
        INNER JOIN tulajdonosok t
        ON j.tulajdonos_id = t.id
        ORDER BY j.javitasi_koltseg ASC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ hiba: err.message });
        }

        res.json(result);
    });
});

// Elkészült és 80000 Ft alatti javítások
app.get("/jarmuvek/kesz", (req, res) => {
    const sql = `
        SELECT *
        FROM jarmuvek
        WHERE kesz_van = 1
        AND javitasi_koltseg <= 80000
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ hiba: err.message });
        }

        res.json(result);
    });
});

// Modell keresés
app.get("/jarmuvek/kereses/:szoveg", (req, res) => {
    const sql = `
        SELECT *
        FROM jarmuvek
        WHERE LOWER(modell) LIKE LOWER(?)
    `;

    db.query(sql, [`%${req.params.szoveg}%`], (err, result) => {
        if (err) {
            return res.status(500).json({ hiba: err.message });
        }

        res.json(result);
    });
});

// Tulajdonos statisztika
app.get("/tulajdonosok/statisztika", (req, res) => {
    const sql = `
        SELECT
            t.nev AS tulajdonos_nev,
            COUNT(j.id) AS jarmuvek_szama,
            ROUND(AVG(j.javitasi_koltseg),0) AS atlagos_koltseg
        FROM tulajdonosok t
        INNER JOIN jarmuvek j
        ON t.id = j.tulajdonos_id
        GROUP BY t.id, t.nev
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ hiba: err.message });
        }

        res.json(result);
    });
});

// 100000 Ft feletti javítások
app.get("/jarmuvek/dragak", (req, res) => {
    const sql = `
        SELECT
            rendszam,
            modell,
            javitasi_koltseg
        FROM jarmuvek
        WHERE javitasi_koltseg > 100000
        ORDER BY javitasi_koltseg DESC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ hiba: err.message });
        }

        res.json(result);
    });
});

// Teszt végpont
app.get("/", (req, res) => {
    res.json({ uzenet: "A szerver fut." });
});

app.listen(3000, () => {
    console.log("A szerver fut a 3000-es porton.");
});