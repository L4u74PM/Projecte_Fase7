<?php
require_once __DIR__ . '/../model/node.php';
 
class nodeDAO {
    private $nodeModel;
 
    public function __construct() {
        // Connexió a la BD SQLite
        $dbPath = __DIR__ . '/../db/nodes.db';
        $db = new SQLite3($dbPath);
        $this->nodeModel = new node($db);
    }
 
    public function getAll() {
        return $this->nodeModel->getAllNodes();
    }
 
    public function getById($id) {
        return $this->nodeModel->getNodeById((int)$id);
    }
 
    public function create($nom, $lloc, $tipus, $email, $lat, $lng) {
        return $this->nodeModel->createNode($nom, $lloc, $tipus, $email, $lat, $lng);
    }
 
    public function update($id, $nom, $lloc, $tipus, $email, $lat, $lng) {
        return $this->nodeModel->updateNode((int)$id, $nom, $lloc, $tipus, $email, $lat, $lng);
    }
 
    public function delete($id) {
        return $this->nodeModel->deleteNode((int)$id);
    }
}
?>