const pool = require("./pool");

async function addUser(fn, sn, email, username, password){
    console.log(fn, sn, email, username, password);
    await pool.query("INSERT INTO users (firstname, lastname, email, username, password) VALUES ($1, $2, $3, $4, $5)", [fn, sn, email, username, password]);
}
module.exports = {
    addUser
};