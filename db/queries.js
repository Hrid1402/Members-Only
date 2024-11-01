const pool = require("./pool");

async function addUser(fn, sn, email, username, password){
    console.log(fn, sn, email, username, password);
    const {rows} = await pool.query("INSERT INTO users (firstname, lastname, email, username, password, admin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [fn, sn, email, username, password, false]);
    return rows[0]; 
}
async function selectUsername(username){
    console.log("userNameOrEmail: " + username);
    const {rows} = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    return rows[0];
}
async function selectEmail(email){
    const {rows} = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return rows[0];
}
async function selectByID(id){
    const {rows} = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0];
}
async function getAllSecrets(){
    const {rows} = await pool.query("SELECT * FROM secrets ORDER BY id DESC");
    return rows;
}
async function getAllSecretsById(id){
    const {rows} = await pool.query("SELECT * FROM secrets WHERE author_id = $1 ORDER BY id DESC", [id]);
    return rows;
}
async function addSecret(author, title, content, date, author_id){
    await pool.query("INSERT INTO secrets (author, title, content, date, author_id) VALUES ($1, $2, $3, $4, $5)", [author, title, content, date, author_id])
}
async function deleteSecretById(id){
    await pool.query("DELETE FROM secrets WHERE id = $1", [id])
}
async function giveAdmin(userId){
    await pool.query("UPDATE users SET admin = TRUE WHERE id = $1", [userId]);
}

module.exports = {
    addUser,
    selectUsername,
    selectEmail,
    selectByID,
    getAllSecrets,
    addSecret,
    getAllSecretsById,
    deleteSecretById,
    giveAdmin
};