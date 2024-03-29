const express = require('express');
const mysql = require('mysql');
const dbconfig = require('./dbConfig')
const sql = require('./sql')
const session = require('express-session')
const redis = require('redis')
const redisClient = redis.createClient(6379, 'session.7mx8kv.0001.use1.cache.amazonaws.com');
const redisStore = require('connect-redis')(session);
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
const BUY_SUCCESS = "The action was successful"
const BUY_NOT_LOGIN = "You are not currently logged in"
const BUY_NO_PRODUCTS = "There are no products that match that criteria"
const PRODUCTS_PURCHASED_SUCCESS = "The action was successful"
const PRODUCTS_PURCHASED_NO_USERS = "There are no users that match that criteria"
const PRODUCTS_PURCHASED_NOT_LOGIN = "You are not currently logged in"
const PRODUCTS_PURCHASED_NOT_ADMIN = "You must be an admin to perform this action"
const RECOMMENDATION_SUCCESS = "The action was successful"
const RECOMMENDATION_EMPTY = "There are no recommendations for that product"
const RECOMMENDATION_NOT_LOGIN = "You are not currently logged in"

var connectionPool = mysql.createPool(dbconfig.mysql_test);

app.use(express.json());

redisClient.on('error', (err) => {
    console.log('Redis error: ', err);
});
redisClient.on('connect', () => {
    console.log('Redis connected');
})
app.use(session({
    secret: 'sessionsecret',
    name: 'ediss_session',
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        maxAge: 900000
    },
    store: new redisStore({
        host: 'session.7mx8kv.0001.use1.cache.amazonaws.com',
        port: 6379,
        client: redisClient,
        ttl: 900
    })
}));

function isEmpty(str) {
    if (typeof str == undefined || str == null || str == "") {
        return true;
    } else {
        return false;
    }
}

app.get('/healthcheck', (req, res) => {
    //console.log("---Health Check---")
    res.send("pong!");
})

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
            console.log(err)
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
                    console.log("[Register User]: Register success for " + req.body.username);
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
    } else {
        // authenticate normal user
        connectionPool.query(sql.authUser, [username, password], function (err, result) {
            if (err) {
                console.log(err)
                console.log("[Log In]: DB query failed.");
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
                        console.log(err)
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
    }
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
        connectionPool.query(sql.getUserByUsername, [res.session.username], function (err, result) {
            if (err) {
                console.log(err)
                console.log("[Update Info]: DB connection failed.");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
            if (result.length != 1) {
                console.log("[Update Info]: Found multiple users");
                return res.json({
                    "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                })
            }
            let user = {}
            user.firstname = result[0].Firstname;
            user.lastname = result[0].lastname;
            user.address = result[0].Address;
            user.city = result[0].City;
            user.state = result[0].State;
            user.zip = result[0].Zip;
            user.email = result[0].Email;
            user.username = result[0].Username;
            user.password = result[0].Password;
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
                if (!isEmpty(req.body.username)) {
                    user.username = req.body.username;
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
            connectionPool.query(sql.updateUser, [user.firstname, user.lastname, user.address, user.city, user.state, user.zip, user.email, user.username, user.password],
                function (err, result) {
                    if (err) {
                        console.log(err)
                        console.log("[Update Info]: DB update failed");
                        return res.json({
                            "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                        })
                    }
                    if (result.affectedRows == 1) {
                        console.log("[Update Info]: Update success");
                        return res.json({
                            "message": user.firstname + UPDATEINFO_SUCCESS
                        })
                    } else {
                        console.log("[Update Info]: DB update multiple user");
                        return res.json({
                            "message": UPDATEINFO_FAIL_ILLEGAL_INPUT
                        })
                    }
                })
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
        if (!req.body.asin || isEmpty(req.body.asin) ||
            !req.body.productName || isEmpty(req.body.productName) ||
            !req.body.productDescription || isEmpty(req.body.productDescription) ||
            !req.body.group || isEmpty(req.body.group)) {
            console.log("[Add Products]: Invalid input");
            return res.json({
                "message": ADDPRODUCTS_FAIL_ILLEGAL_INPUT
            })
        } else {
            connectionPool.query(sql.insertProduct, [req.body.productName, req.body.group, req.body.productDescription, req.body.asin], function (err, result) {
                if (err) {
                    console.log(err)
                    console.log("[Add Products]: DB insert failed.");
                    return res.json({
                        "message": ADDPRODUCTS_FAIL_ILLEGAL_INPUT
                    })
                } else {
                    console.log("[Add Products]: Add product success");
                    return res.json({
                        "message": req.body.productName + ADDPRODUCTS_SUCCESS,
                    })
                }
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
        if (!req.body.asin || isEmpty(req.body.asin) ||
            !req.body.productName || isEmpty(req.body.productName) ||
            !req.body.productDescription || isEmpty(req.body.productDescription) ||
            !req.body.group || isEmpty(req.body.group)) {
            console.log("[Modify Product]: Invalid input");
            return res.json({
                "message": MODIFYPRODUCT_FAIL_ILLEGAL_INPUT
            })
        } else {
            connectionPool.query(sql.updateProduct, [req.body.productName, req.body.group, req.body.productDescription, req.body.asin], function (err, result) {
                if (err) {
                    console.log(err)
                    console.log("[Modify Product]: DB update failed");
                    return res.json({
                        "message": MODIFYPRODUCT_FAIL_ILLEGAL_INPUT
                    })
                }
                if (result.affectedRows == 1) {
                    console.log("[Modify Product]: Modify product success");
                    return res.json({
                        "message": req.body.productName + MODIFYPRODUCT_SUCCESS
                    })
                } else {
                    console.log("[Modify Product]: DB update multiple products.");
                    return res.json({
                        "message": MODIFYPRODUCT_FAIL_ILLEGAL_INPUT
                    })
                }
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
    } else {
        let firstnameKeyword = "%"
        let lastnameKeyword = "%"
        if (req.body.fname && !isEmpty(req.body.fname)) firstnameKeyword = "%" + req.body.fname + "%"
        if (req.body.lname && !isEmpty(req.body.lname)) lastnameKeyword = "%" + req.body.lname + "%"
        connectionPool.query(sql.getUserByKeywords, [firstnameKeyword, lastnameKeyword], function (err, result) {
            if (err) {
                console.log(err)
                console.log("View Users]: DB query failed.")
                return res.json({
                    "message": VIEWUSERS_FAIL_NO_USERS
                })
            }
            if (result.length == 0) {
                console.log("[View Users]: No registered users");
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
        })
    }
});

app.post('/viewProducts', (req, res) => {
    let asinKeyword = "%"
    let nameAndDescriptionKeyword = "%"
    let groupKeyword = "%"
    if (req.body.asin && !isEmpty(req.body.asin)) asinKeywords = req.body.asin
    if (req.body.keyword && !isEmpty(req.body.keyword)) nameAndDescriptionKeyword = "+" + '"' + req.body.keyword + '"'
    if (req.body.group && !isEmpty(req.body.group)) groupKeyword = "%" + req.body.group + "%"
    connectionPool.query(sql.getProductByKeywords, [nameAndDescriptionKeyword, groupKeyword, asinKeyword], function (err, result) {
        if (err) {
            console.log(err)
            console.log("[View Products]: DB query failed");
            return res.json({
                "message": VIEWPRODUCTS_FAIL
            })
        }
        if (result.length == 0) {
            console.log("[View Products]: No product found.");
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
});

app.post('/buyProducts', (req, res) => {
    if (!req.session.login || req.session.admin || !req.session.username) {
        console.log("[Buy Products]: User hasn't been logged in: ");
        return res.json({
            "message": BUY_NOT_LOGIN
        });
    } else if (!req.body.products || req.body.products.length == 0) {
        console.log("[Buy Products]: Empty buy list")
        return res.json({
            "message": BUY_NO_PRODUCTS
        });
    } else {
        let whereClause = ""
        let idx = 0
        let pd = req.body.products
        for (; idx < req.body.products.length - 1; idx++) {
            whereClause += 'ASIN = \'' + req.body.products[idx].asin + '\' OR '
        }
        whereClause += 'ASIN = \'' + req.body.products[idx].asin + '\''
        let queryStatement = sql.checkProductsExist + whereClause
        connectionPool.query(queryStatement, function (err, result) {
            if (err) {
                console.log(err)
                console.log("[Buy Products]: DB query failed")
                return res.json({
                    "message": BUY_NO_PRODUCTS
                });
            }
            if (result[0].count != req.body.products.length) {
                console.log("[Buy Products]: Cannot find some product in DB.")
                return res.json({
                    "message": BUY_NO_PRODUCTS
                });
            } else {
                connectionPool.query(sql.insertOrders, [req.session.username], function (err, result) {
                    if (err) {
                        console.log(err)
                        console.log("[Buy Products]: Insert into orders failed.")
                        return res.json({
                            "message": BUY_NO_PRODUCTS
                        });
                    }
                    let orderId = result.insertId
                    let insertArray = []
                    for (let i = 0; i < req.body.products.length; i++) {
                        let insertItem = []
                        insertItem.push(orderId)
                        insertItem.push(req.body.products[i].asin)
                        insertArray.push(insertItem)
                    }
                    connectionPool.query(sql.insertReceipts, [insertArray], function (err, result) {
                        if (err) {
                            console.log(err)
                            console.log("[Buy Products]: Insert into receipts failed.")
                            return res.json({
                                "message": BUY_NO_PRODUCTS
                            });
                        }
                        // let historyArray = []
                        // for (let i = 0; i < req.body.products.length; i++) {
                        //     let insertItem = []
                        //     insertItem.push(req.session.username)
                        //     insertItem.push(req.body.products[i].asin)
                        //     insertItem.push(1)
                        //     historyArray.push(insertItem)
                        // }
                        console.log("[Buy Products]: Buying success. Order number: " + orderId)
                            return res.json({
                                "message": BUY_SUCCESS
                            });
                        // connectionPool.query(sql.insertHistory, [historyArray], function (err, result) {
                        //     if (err) {
                        //         console.log(err)
                        //         console.log("Buy Products]: Insert into history failed.")
                        //         return res.json({
                        //             "message": BUY_NO_PRODUCTS
                        //         });
                        //     }
                        //     console.log("[Buy Products]: Buying success. Order number: " + orderId)
                        //     return res.json({
                        //         "message": BUY_SUCCESS
                        //     });
                        // })
                    })
                })
            }
        })
    }
});

app.post('/productsPurchased', (req, res) => {
    if (!req.session.login) {
        console.log("[Products Purchased]: User hasn't been logged in");
        return res.json({
            "message": PRODUCTS_PURCHASED_NOT_LOGIN
        });
    } else if (!req.session.admin) {
        console.log("[Products Purchased]: User is not admin");
        return res.json({
            "message": PRODUCTS_PURCHASED_NOT_ADMIN
        })
    } else if (!req.body.username) {
        console.log("[Products Purchased]: No input user in request body");
        return res.json({
            "message": PRODUCTS_PURCHASED_NO_USERS
        })
    } else {
        connectionPool.query(sql.getProductsPurchasedByUsername, [req.body.username], function(err, result) {
            if (err) {
                console.log(err)
                console.log("[Products Purchased]: DB query failed.")
                return res.json({
                    "message": PRODUCTS_PURCHASED_NO_USERS
                })
            }
            if (result.length == 0) {
                console.log("[Products Purchased]: No user found")
                return res.json({
                    "message": PRODUCTS_PURCHASED_NO_USERS
                })
            } else {
                console.log("[Products Purchased]: Found user with order history: " + req.body.username)
                return res.json({
                    "message": PRODUCTS_PURCHASED_SUCCESS,
                    "products": result
                })
            }
        })
    }
});

app.post('/getRecommendations', (req, res) => {
    if (req.session.login) {
        connectionPool.query(sql.getRecommendation, [req.body.asin, req.body.asin], function (err, result) {
            if (err) {
                console.log(err)
                console.log("[Recommendation]: DB query failed")
                return res.json({
                    "message": RECOMMENDATION_EMPTY
                })
            }
            if (result.length == 0) {
                console.log("[Recommendation]: No recommendation found for asin: " + req.body.asin)
                return res.json({
                    "message": RECOMMENDATION_EMPTY
                })
            } else {
                console.log("[Recommendation]: Found recommendation for asin: " + req.body.asin)
                return res.json({
                    "message": REGISTER_SUCCESS,
                    "asin": result
                })
            }
        })
    } else {
        console.log("[Recommendation]: User hasn't logged in");
        return res.json({
            "message": RECOMMENDATION_NOT_LOGIN
        })
    }
});

app.listen(port, function (err) {
    if (err) {
        console.log("[PJ3]: App start failed. Port: " + port);
    } else {
        console.log("[PJ3]: App start success. Port: " + port);
    }
});