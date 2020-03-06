const PRODUCTS_TABLE = "products"
const USER_TABLE = "users"
const ORDER_TABLE = "orders"
const RECEIPT_TABLE = "receipts"
const HISTORY_TABLE = "history"

var sql = {
    // products
    insertProduct: 'INSERT INTO ' + PRODUCTS_TABLE + ' (Name, ProductGroup, Description, ASIN) VALUES (?, ?, ?, ?)',
    updateProduct: 'UPDATE ' + PRODUCTS_TABLE + ' SET Name = ?, ProductGroup = ?, Description = ? WHERE ASIN = \'?\'',
    getProductByKeywords: 'SELECT ASIN AS asin, Name as productName FROM ' + PRODUCTS_TABLE + ' WHERE MATCH(Name, Description) against(? IN BOOLEAN MODE) AND ProductGroup LIKE ? AND ASIN LIKE ?',
    checkProductsExist: 'SELECT COUNT(*) AS count FROM ' + PRODUCTS_TABLE + ' WHERE ',


    // users
    insertUsers: 'INSERT INTO ' + USER_TABLE + ' (Firstname, Lastname, Address, City, State, Zip, Email, Username, Password) VALUES (?,?,?,?,?,?,?,?,?)',
    getPasswordByUsername: 'SELECT Password FROM ' + USER_TABLE + ' WHERE Username = ?',
    hasUser: 'SELECT COUNT(*) AS count FROM ' + USER_TABLE + ' WHERE Username = ?',
    authUser: 'SELECT * FROM ' + USER_TABLE + ' WHERE Username = ? AND Password = ?',
    getUserByUsername: 'SELECT * FROM ' + USER_TABLE + ' WHERE Username = ?',
    updateUser: 'UPDATE ' + USER_TABLE + ' SET Firstname = ?, Lastname = ?, Address = ?, City = ?, State = ?, Zip = ?, Email = ?, Username = ?, Password = ? WHERE Username = ?',
    getUserByKeywords: 'SELECT Firstname AS fname, Lastname AS lname, Username AS userId FROM ' + USER_TABLE + ' WHERE Firstname LIKE ? AND Lastname LIKE ?',

    // orders and receipts
    insertOrders: 'INSERT INTO ' + ORDER_TABLE + ' (Username) VALUES (?)',
    insertReceipts: 'INSERT INTO ' + RECEIPT_TABLE + ' (OrderId, ASIN) VALUES ?',
    getReceiptsByUsername: 'SELECT * ',

    // history
    insertHistory: 'INSERT INTO ' + HISTORY_TABLE + ' (Username, ASIN, Quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE Quantity = Quantity + 1',
    getHistoryByUser: 'SELECT products.Name as productName, history.Quantity as quantity FROM products, history WHERE history.Username = ? AND history.ASIN = products.ASIN'
}

module.exports = sql