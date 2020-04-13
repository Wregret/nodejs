const PRODUCTS_TABLE = "products"
const USER_TABLE = "users"
const ORDER_TABLE = "orders"
const RECEIPT_TABLE = "receipts"
const HISTORY_TABLE = "history"

var sql = {
    // products
    insertProduct: 'INSERT INTO ' + PRODUCTS_TABLE + ' (Name, ProductGroup, Description, ASIN) VALUES (?, ?, ?, ?)',
    updateProduct: 'UPDATE ' + PRODUCTS_TABLE + ' SET Name = ?, ProductGroup = ?, Description = ? WHERE ASIN = ?',
    getProductByKeywords: 'SELECT ASIN AS asin, Name as productName FROM ' + PRODUCTS_TABLE + ' WHERE MATCH(Name, Description) against(? IN BOOLEAN MODE) AND ProductGroup LIKE ? AND ASIN LIKE ? ORDER BY LENGTH(Name) ASC',
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
    getProductsPurchasedByUsername: 'SELECT Name AS productName, count(*) AS quantity FROM products, orders, receipts WHERE orders.Username = ? AND orders.OrderId = receipts.OrderId AND receipts.ASIN = products.ASIN GROUP BY receipts.ASIN',

    getRecommendation: 'SELECT ASIN AS asin FROM (select ASIN, count(*) FROM receipts WHERE OrderId IN (SELECT OrderId FROM receipts WHERE ASIN = ?) AND ASIN != ? GROUP BY ASIN ORDER BY count(*) DESC) AS recommend_list LIMIT 5'
}

module.exports = sql