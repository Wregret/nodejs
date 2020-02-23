const PRODUCTS_TABLE = "products"
const USER_TABLE = "user"

var sql = {
    // products
    insertProduct: 'INSERT INTO ' + PRODUCTS_TABLE + ' (Name, ProductGroup, Description, ASIN) VALUES (?, ?, ?, ?)',
    updateProductName: 'UPDATE ' + PRODUCTS_TABLE + ' SET Name = ? WHERE ASIN = ?',
    updateProductGroup: 'UPDATE ' + PRODUCTS_TABLE + ' SET ProductGroup = ? WHERE ASIN = ?',
    updateDescription: 'UPDATE ' + PRODUCTS_TABLE + ' SET Description = ? WHERE ASIN = ?',


    // users
    insertUsers: 'INSERT INTO ' + USER_TABLE + ' (Firstname, Lastname, Address, City, State, Zip, Email, Username, Password) VALUES (?,?,?,?,?,?,?,?,?)',
    getPasswordByUsername: 'SELECT Password FROM ' + USER_TABLE + ' WHERE Username = ?',
    hasUser: 'SELECT COUNT(*) AS count FROM ' + USER_TABLE + ' WHERE Username = ?',
    authUser: 'SELECT * FROM ' + USER_TABLE + ' WHERE Username = ? AND Password = ?',
    getUserByUsername: 'SELECT * FROM ' + USER_TABLE + ' WHERE Username = ?',
    updateUser: 'UPDATE ' + USER_TABLE + ' SET Firstname = ?, Lastname = ?, Address = ?, City = ?, State = ?, Zip = ?, Email = ?, Username = ?, Password = ? WHERE Username = ?',
}

module.exports = sql