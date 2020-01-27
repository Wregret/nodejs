const express = require('express');
const mysql = require('mysql');
const session = require('express-session')
const app = express();
const port = 4000;

const CALCULATION_SUCCESS = "The action was successful";
const INVALID_NUMBER = "The numbers you entered are not valid";
const INVALID_ACCESS = "You are not currently logged in";
const LOGIN_SUCCESS = "Welcome ";
const LOGIN_FAIL = "There seems to be an issue with the username/password combination that you entered";
const LOGOUT_SUCCESS = "You have been successfully logged out";
const LOGOUT_FAIL = "You are not currently logged in";

var connection = mysql.createConnection({
    host: 'nodejs.chxymz1ectvr.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'codelyoko',
    database: 'nodejs'
});

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

app.post('/login', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var firstname = null;
    connection.query('SELECT * FROM account WHERE username = ? AND password = ?', [username, password], function (error, result, fields) {
        if (error) {
            console.log(error);
            console.log("[LOG IN]: DB query fail");
            return res.json({
                "message": LOGIN_FAIL
            });
        }
        if (result.length > 0) {
            req.session.regenerate(function (err) {
                if (err) {
                    console.log("[LOG IN]: Session regenerate fail"); 
                    return res.json({
                        "message": LOGIN_FAIL
                    });
                }
                req.session.loggedin = true;
                req.session.username = username;
                firstname = result[0].firstname;
                console.log("[LOG IN]: Log in success, username: " + username);
                return res.json({
                    "message": LOGIN_SUCCESS + firstname
                });
            })
        } else {
            console.log("[LOG IN]: Log in fail. Cannot match username: " + username);
            return res.json({
                "message": LOGIN_FAIL
            });
        }
    })
});

app.post('/logout', (req, res) => {
    if (req.session.loggedin) {
        req.session.destroy(function (err) {
            if (err) {
                console.log("[LOG OUT]: Log out fail. Cannot destroy session");
                return res.json({
                    "message": LOGOUT_FAIL
                })
            } else {
                console.log("[LOG OUT]: Log out success")
                return res.json({
                    "message": LOGOUT_SUCCESS
                })
            }
        });
    } else {
        console.log("[LOG OUT]: Log out fail. User hasn't logged in");
        return res.json({
            "message": LOGOUT_FAIL
        })
    }
})

app.post('/add', (req, res) => {
    if (req.session.loggedin) {
        var data = req.body;
        console.log("[ADD]: " + data.num1 + " + " + data.num2);
        var result = parseFloat(data.num1) + parseFloat(data.num2);
        if (isFinite(result)) {
            console.log("[ADD]: Add success");
            return res.json({
                "message": CALCULATION_SUCCESS,
                "result": result
            })
        } else {
            console.log("[ADD]: Invalid number");
            return res.json({
                "message": INVALID_NUMBER
            })
        }
    } else {
        console.log("[ADD]: User doesn't log in");
        return res.json({
            "message": INVALID_ACCESS
        })
    }

});

app.post('/multiply', (req, res) => {
    if (req.session.loggedin) {
        var data = req.body;
        console.log("[MULTIPLY]: " + data.num1 + " * " + data.num2);
        var result = parseFloat(data.num1) * parseFloat(data.num2);
        if (isFinite(result)) {
            console.log("[MULTIPLY]: Multiply success");
            return res.json({
                "message": CALCULATION_SUCCESS,
                "result": result
            })
        } else {
            console.log("[MULTIPLY]: Invalid number");
            return res.json({
                "message": INVALID_NUMBER
            })
        }
    } else {
        console.log("[ADD]: User doesn't log in");
        return res.json({
            "message": INVALID_ACCESS
        })
    }

})

app.post('/divide', (req, res) => {
    if (req.session.loggedin) {
        var data = req.body;
        console.log("[DIVIDE]: " + data.num1 + " / " + data.num2);
        var result = parseFloat(data.num1) / parseFloat(data.num2);
        if (isFinite(result)) {
            console.log("[DIVIDE]: Divide success");
            return res.json({
                "message": CALCULATION_SUCCESS,
                "result": result
            })
        } else {
            console.log("[DIVIDE]: Invalid number");
            return res.json({
                "message": INVALID_NUMBER
            })
        }
    } else {
        console.log("[DIVIDE]: User doesn't log in");
        return res.json({
            "message": INVALID_ACCESS
        })
    }

})


app.listen(port, function(err) {
    if (err) {
        console.log("[APP]: App start failed. Port: " + port);
    } else {
        console.log("[APP]: App start success. Port: " + port);
    }
});