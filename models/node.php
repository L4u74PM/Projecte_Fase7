<?php
class node {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAllNodes() {
        $result = $this->db->query("SELECT * FROM nodes");
        $nodes = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $nodes[] = $row;
        }
        return $nodes;
    }

    public function getNodeById($id) {
        $stmt = $this->db->prepare("SELECT * FROM nodes WHERE id = :id");
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        return $result->fetchArray(SQLITE3_ASSOC);
    }

    public function createNode($nom, $lloc, $tipus, $email, $lat, $lng) {
        $stmt = $this->db->prepare("INSERT INTO nodes (nom, lloc, tipus, email, lat, lng) VALUES (:nom, :lloc, :tipus, :email, :lat, :lng)");
        $stmt->bindValue(':nom', $nom, SQLITE3_TEXT);
        $stmt->bindValue(':lloc', $lloc, SQLITE3_TEXT);
        $stmt->bindValue(':tipus', $tipus, SQLITE3_TEXT);
        $stmt->bindValue(':email', $email, SQLITE3_TEXT);
        // CORREGIDO: Usamos SQLITE3_FLOAT en lugar de SQLITE3_REAL
        $stmt->bindValue(':lat', $lat, SQLITE3_FLOAT);
        $stmt->bindValue(':lng', $lng, SQLITE3_FLOAT);
        return $stmt->execute();
    }

    public function updateNode($id, $nom, $lloc, $tipus, $email, $lat, $lng) {
        $stmt = $this->db->prepare("UPDATE nodes SET nom = :nom, lloc = :lloc, tipus = :tipus, email = :email, lat = :lat, lng = :lng WHERE id = :id");
        $stmt->bindValue(':nom', $nom, SQLITE3_TEXT);
        $stmt->bindValue(':lloc', $lloc, SQLITE3_TEXT);
        $stmt->bindValue(':tipus', $tipus, SQLITE3_TEXT);
        $stmt->bindValue(':email', $email, SQLITE3_TEXT);
        // CORREGIDO: Usamos SQLITE3_FLOAT en lugar de SQLITE3_REAL
        $stmt->bindValue(':lat', $lat, SQLITE3_FLOAT);
        $stmt->bindValue(':lng', $lng, SQLITE3_FLOAT);
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        return $stmt->execute();
    }

    public function deleteNode($id) {
        $stmt = $this->db->prepare("DELETE FROM nodes WHERE id = :id");
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        return $stmt->execute();
    }
}
?>