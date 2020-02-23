const PRODUCTS_TABLE = "products"
const USER_TABLE = "users"

var sql = {
    // products
    insertProduct: 'INSERT INTO ' + PRODUCTS_TABLE + ' (Name, ProductGroup, Description, ASIN) VALUES (?, ?, ?, ?)',
    updateProduct: 'UPDATE ' + PRODUCTS_TABLE + ' SET Name = ?, ProductGroup = ?, Description = ? WHERE ASIN = ?',
    getProductByKeywords: 'SELECT ASIN AS asin, Name as productName FROM ' + PRODUCTS_TABLE + ' WHERE Name LIKE ? AND ProductGroup LIKE ? AND Description LIKE ? AND ASIN LIKE ?',


    // users
    insertUsers: 'INSERT INTO ' + USER_TABLE + ' (Firstname, Lastname, Address, City, State, Zip, Email, Username, Password) VALUES (?,?,?,?,?,?,?,?,?)',
    getPasswordByUsername: 'SELECT Password FROM ' + USER_TABLE + ' WHERE Username = ?',
    hasUser: 'SELECT COUNT(*) AS count FROM ' + USER_TABLE + ' WHERE Username = ?',
    authUser: 'SELECT * FROM ' + USER_TABLE + ' WHERE Username = ? AND Password = ?',
    getUserByUsername: 'SELECT * FROM ' + USER_TABLE + ' WHERE Username = ?',
    updateUser: 'UPDATE ' + USER_TABLE + ' SET Firstname = ?, Lastname = ?, Address = ?, City = ?, State = ?, Zip = ?, Email = ?, Username = ?, Password = ? WHERE Username = ?',
    getUserByKeywords: 'SELECT Firstname AS fname, Lastname AS lname, Username AS userId FROM ' + USER_TABLE + ' WHERE Firstname LIKE ? AND Lastname LIKE ?'
}

module.exports = sql