const express = require('express');
const mysql = require('mysql');
const dbconfig = require('./dbConfig')
const sql = require('./sql')
const session = require('express-session')
const app = express();
const port = 4000;

const ADMIN_USERNAME = "jadmin"
const ADMIN_PASSWORD = "admin"
const ADMIN_FIRSTNAME = "Jenny"
const ADMIN_LASTNAME = "Admin"

const REGISTER_SUCCESS = " was registered successfully"
const REGISTER_FAIL = "The input you provided is not valid"
const LOGIN_SUCCESS = "Welcome "
const LOGIN_FAIL = "There seems to be an issue with the username/password combination that you entered"
const LOGOUT_SUCCESS = "You have been successfully logged out"
const LOGOUT_FAIL = "You are not currently logged in"
const UPDATEINFO_SUCCESS = " your information was successfully updated"
const UPDATEINFO_FAIL_NOT_LOGIN = "You are not currently logged in"
const UPDATEINFO_FAIL_ILLEGAL_INPUT = "The input you provided is not valid"
const ADDPRODUCTS_SUCCESS = " was successfully added to the system"
const ADDPRODUCTS_FAIL_NOT_LOGIN = "You are not currently logged in"
const ADDPRODUCTS_FAIL_NOT_ADMIN = "You must be an admin to perform this action"
const ADDPRODUCTS_FAIL_ILLEGAL_INPUT = "The input you provided is not valid"
const MODIFYPRODUCT_SUCCESS = " was successfully updated"
const MODIFYPRODUCT_FAIL_NOT_LOGIN = "You are not currently logged in"
const MODIFYPRODUCT_FAIL_NOT_ADMIN = "You must be an admin to perform this action"
const MODIFYPRODUCT_FAIL_ILLEGAL_INPUT = "The input you provided is not valid"
const VIEWUSERS_SUCCESS = "The action was successful"
const VIEWUSERS_FAIL_NO_USERS = "There are no users that match that criteria"
const VIEWUSERS_FAIL_NOT_LOGIN = "You are not currently logged in"
const VIEWUSERS_FAIL_NOT_ADMIN = "You must be an admin to perform this action"
const VIEWPRODUCTS_FAIL = "There are no products that match that criteria"

var connectionPool = mysql.createPool(dbconfig.mysql_test);

app.use(express.json());
app.use(session({
    secret: 'sessionsecret',
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        maxAge: 900000
    }
}));

function isEmpty(str) {
    if (typeof str == undefined || str == null || str == "") {
        return true;
    } else {
        return false;
    }
}

app.post('/registerUser', (req, res) => {
    // check same as admin
    if (req.body.username == ADMIN_USERNAME) {
        console.log("[Register User]: Duplicate Username: " + req.body.username);
        return res.json({
            "message": REGISTER_FAIL
        });
    }
    // check same as other users
    connectionPool.query(sql.hasUser, [req.body.username], function (err, result) {
        if (err) {
            console.log("[Register User]: DB query failed.");
            return res.json({
                "message": REGISTER_FAIL
            });
        }
        if (result[0].count > 0) {
            console.log("[Register User]: Duplicate Username: " + req.body.username);
            return res.json({
                "message": REGISTER_FAIL
            });
        } else if (!req.body.fname || isEmpty(req.body.fname) ||
            !req.body.lname || isEmpty(req.body.lname) ||
            !req.body.address || isEmpty(req.body.address) ||
            !req.body.city || isEmpty(req.body.city) ||
            !req.body.state || isEmpty(req.body.state) ||
            !req.body.zip || isEmpty(req.body.zip) ||
            !req.body.email || isEmpty(req.body.zip) ||
            !req.body.username || isEmpty(req.body.username) ||
            !req.body.password || isEmpty(req.body.password)) {
            // check invalid input
            console.log("[Register User]: Incomplete user info for user: " + req.body.username);
            return res.json({
                "message": REGISTER_FAIL
            });
        } else {
            // register
            connectionPool.query(sql.insertUsers, [req.body.fname, req.body.lname, req.body.address, req.body.city, req.body.state, req.body.zip, req.body.email, req.body.username, req.body.password],
                function (err, result) {
                    if (err) {
                        console.log("[Register User]: Save user failed for user: " + req.body.username);
                        return res.json({
                            "message": REGISTER_FAIL
                        });
                    }
                    console.log("[Register User]: Register success for " + user.username);
                    return res.json({
                        "message": req.body.fname + REGISTER_SUCCESS
                    });
                })
        }
    })
});

app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    // authenticate admin user
    if (username == ADMIN_USERNAME) {
        if (password == ADMIN_PASSWORD) {
            req.session.regenerate(function (err) {
                if (err) {
                    console.log("[Log In]: Admin session generation failed");
                    return res.json({
                        "message": LOGIN_FAIL
                    })
                }
                req.session.login = true;
                req.session.username = username;
                req.session.admin = true;
                console.log("[Log In]: Admin log in success");
                return res.json({
                    "message": LOGIN_SUCCESS + ADMIN_FIRSTNAME
                })
            })
        } else {
            console.log("[Log In]: Admin log in failed");
            return res.json({
                "message": LOGIN_FAIL
            })
        }
    }
    // authenticate normal user
    connectionPool.query(sql.authUser, [username, password], function (err, result) {
        if (err) {
            console.log("[Register User]: DB query failed.");
            return res.json({
                "message": REGISTER_FAIL
            });
        }
        if (result.length != 1) {
            console.log("[Log In]: Log in failed for " + username);
            return res.json({
                "message": LOGIN_FAIL
            })
        } else {
            req.session.regenerate(function (err) {
                if (err) {
                    console.log("[Log In]: Session generation failed for " + username);
                    return res.json({
                        "message": LOGIN_FAIL
                    })
                }
                req.session.login = true;
                req.session.username = username;
                req.session.admin = false;
                console.log("[Log In]: Log in success for " + username);
                return res.json({
                    "message": LOGIN_SUCCESS + result[0].Firstname
                });
            })
        }
    })
});

app.post('/logout', (req, res) => {
    if (req.session.login) {
        let username = req.session.username;
        req.session.destroy(function (err) {
            if (err) {
                console.log("[Log Out]: Session destroy failed for " + username);
                return res.json({
                    "message": LOGOUT_FAIL
                })
            }
            console.log("[Log Out]: Log Out success for " + username);
            return res.json({
                "message": LOGOUT_SUCCESS
            })
        });
    } else {
        console.log("[Log Out]: Log Out fail. User hasn't been logged in")
        return res.json({
            "message": LOGOUT_FAIL
        })
    }
});

app.post('/updateInfo', (req, res) => {
    // check normal user
    if (res.session.login && !res.session.admin) {
        connectionPool.query(getUser)
    }
    if (res.session.login && register.has(res.session.username)) {
        let username = res.session.username;
        let user = register.get(username);
        if (req.body.fname) {
            if (!isEmpty(req.body.fname)) {
                user.firstname = req.body.fname;
            } else {
                console.log("[Update Info]: Invalid fname input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        if (req.body.lname) {
            if (!isEmpty(req.body.lname)) {
                user.lastname = req.body.fname;
            } else {
                console.log("[Update Info]: Invalid lname input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        if (req.body.address) {
            if (!isEmpty(req.body.address)) {
                user.address = req.body.address;
            } else {
                console.log("[Update Info]: Invalid address input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        if (req.body.city) {
            if (!isEmpty(req.body.city)) {
                user.city = req.body.city;
            } else {
                console.log("[Update Info]: Invalid city input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        if (req.body.state) {
            if (!isEmpty(req.body.state)) {
                user.state = req.body.state;
            } else {
                console.log("[Update Info]: Invalid state input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        if (req.body.zip) {
            if (!isEmpty(req.body.zip)) {
                user.zip = req.body.zip;
            } else {
                console.log("[Update Info]: Invalid zip input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        if (req.body.email) {
            if (!isEmpty(req.body.email)) {
                user.email = req.body.email;
            } else {
                console.log("[Update Info]: Invalid email input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        if (req.body.username) {
            if (!isEmpty(req.body.username) || !register.has(req.body.username)) {
                user.username = req.body.username;
                session.username = req.body.username
            } else {
                console.log("[Update Info]: Invalid username input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        if (req.body.password) {
            if (!isEmpty(req.body.password)) {
                user.password = req.body.password;
            } else {
                console.log("[Update Info]: Invalid password input");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
        }
        console.log("[Update Info]: Update success");
        return res.json({
            "message": user.firstname + UPDATEINFO_SUCCESS
        })
    } else {
        console.log("[Update Info]: Update Info fail. User hasn't been logged in");
        return res.json({
            "message": UPDATEINFO_FAIL_NOT_LOGIN
        });
    }
});

app.post('/addProducts', (req, res) => {
    if (!req.session.login) {
        console.log("[Add Products]: User hasn't been logged in");
        return res.json({
            "message": ADDPRODUCTS_FAIL_NOT_LOGIN
        })
    } else if (!req.session.admin) {
        console.log("[Add Products]: User is not admin");
        return res.json({
            "message": ADDPRODUCTS_FAIL_NOT_ADMIN
        })
    } else {
        if (!req.body.asin || isEmpty(req.body.asin) || itembook.has(req.body.asin) ||
            !req.body.productName || isEmpty(req.body.productName) ||
            !req.body.productDescription || isEmpty(req.body.productDescription) ||
            !req.body.group || isEmpty(req.body.group) /*|| !itemgroup.has(req.body.group)*/) {
            console.log("[Add Products]: Invalid input");
            return res.json({
                "message": ADDPRODUCTS_FAIL_ILLEGAL_INPUT
            })
        } else {
            let item = {}
            item.asin = req.body.asin;
            item.productName = req.body.productName;
            item.productDescription = req.body.productDescription;
            item.group = req.body.group;
            itembook.set(item.asin, item);
            console.log("[Add Products]: Add product success");
            return res.json({
                "message": item.productName + ADDPRODUCTS_SUCCESS,
            })
        }
    }
});

app.post('/modifyProduct', (req, res) => {
    if (!req.session.login) {
        console.log("[Modify Product]: User hasn't been logged in");
        return res.json({
            "message": MODIFYPRODUCT_FAIL_NOT_LOGIN
        })
    } else if (!req.session.admin) {
        console.log("[Modify Product]: User is not admin");
        return res.json({
            "message": MODIFYPRODUCT_FAIL_NOT_ADMIN
        })
    } else {
        if (!req.body.asin || isEmpty(req.body.asin) || !itembook.has(req.body.asin) ||
            !req.body.productName || isEmpty(req.body.productName) ||
            !req.body.productDescription || isEmpty(req.body.productDescription) ||
            !req.body.group || isEmpty(req.body.group) /*|| !itemgroup.has(req.body.group)*/) {
            console.log("[Modify Product]: Invalid input");
            return res.json({
                "message": MODIFYPRODUCT_FAIL_ILLEGAL_INPUT
            })
        } else {
            let item = itembook.get(req.body.asin);
            item.productName = req.body.productName;
            item.productDescription = req.body.productDescription;
            item.group = req.body.group;
            console.log("[Modify Product]: Modify product success");
            return res.json({
                "message": item.productName + MODIFYPRODUCT_SUCCESS
            })
        }
    }
})

app.post('/viewUsers', (req, res) => {
    if (!req.session.login) {
        console.log("[View Users]: User hasn't been logged in");
        return res.json({
            "message": VIEWUSERS_FAIL_NOT_LOGIN
        });
    } else if (!req.session.admin) {
        console.log("[View Users]: User is not admin");
        return res.json({
            "message": VIEWUSERS_FAIL_NOT_ADMIN
        })
    } else if (register.size == 0) {
        console.log("[View Users]: No registered users");
        return res.json({
            "message": VIEWUSERS_FAIL_NO_USERS
        })
    } else {
        let result = [];
        if (req.body.fname && !isEmpty(req.body.fname) && req.body.lname && !isEmpty(req.body.lname)) {
            register.forEach((user, username, register) => {
                if (user.firstname.search(req.body.fname) != -1 && user.lastname.search(req.body.lname) != -1) {
                    result.push({ fname: user.firstname, lname: user.lastname, userId: user.username })
                }
            })
        } else if (req.body.fname && !isEmpty(req.body.fname)) {
            register.forEach((user, username, register) => {
                if (user.firstname.search(req.body.fname) != -1) {
                    result.push({ fname: user.firstname, lname: user.lastname, userId: user.username })
                }
            })
        } else if (req.body.lname && !isEmpty(req.body.lname)) {
            register.forEach((user, username, register) => {
                if (user.lastname.search(req.body.lname) != -1) {
                    result.push({ fname: user.firstname, lname: user.lastname, userId: user.username })
                }
            })
        } else {
            register.forEach((user, username, register) => {
                result.push({ fname: user.firstname, lname: user.lastname, userId: user.username })
            })
        }
        if (result.length == 0) {
            console.log("[View Users]: No matching results found");
            return res.json({
                "message": VIEWUSERS_FAIL_NO_USERS
            })
        } else {
            console.log("[View Users]: Found users: " + result.length);
            return res.json({
                "message": VIEWUSERS_SUCCESS,
                "user": result
            })
        }
    }
});

app.post('/viewProducts', (req, res) => {
    let resultSet = new Set();
    if (req.body.asin && !isEmpty(req.body.asin)) {
        itembook.forEach((product, asin, itembook) => {
            if (product.asin == req.body.asin) {
                resultSet.add(product);
            }
        })
    }
    if (req.body.keyword && !isEmpty(req.body.keyword)) {
        itembook.forEach((product, asin, itembook) => {
            if (product.productName.search(req.body.keyword) != -1 || product.productDescription.search(req.body.keyword) != -1) {
                resultSet.add(product)
            }
        })
    }
    if (resultSet.length == 0) {
        itembook.forEach((product, asin, itembook) => {
            resultSet.add(product);
        })
    }
    let result = [];
    if (req.body.group && !isEmpty(req.body.group)) {
        for (let item of resultSet) {
            if (item.group == req.body.group) {
                result.push({ asin: item.asin, productName: item.productName });
            }
        }
    } else {
        for (let item of resultSet) {
            result.push({ asin: item.asin, productName: item.productName })
        }
    }
    if (result.length == 0) {
        console.log("[View Products]: Itembook is empty");
        return res.json({
            "message": VIEWPRODUCTS_FAIL
        })
    } else {
        console.log("[View Products]: Found products: " + result.length);
        return res.json({
            "product": result
        })
    }
})

app.listen(port, function (err) {
    if (err) {
        console.log("[PJ3]: App start failed. Port: " + port);
    } else {
        console.log("[PJ3]: App start success. Port: " + port);
    }
});