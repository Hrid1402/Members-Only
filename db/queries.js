const pool = require("./pool");

async function addUser(fn, sn, email, username, password){
    console.log(fn, sn, email, username, password);
    const {rows} = await pool.query("INSERT INTO users (firstname, lastname, email, username, password) VALUES ($1, $2, $3, $4, $5) RETURNING *", [fn, sn, email, username, password]);
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
    const {rows} = await pool.query("SELECT * FROM users WHERE id = $1", [id])
    return rows[0];
}


module.exports = {
    addUser,
    selectUsername,
    selectEmail,
    selectByID
};