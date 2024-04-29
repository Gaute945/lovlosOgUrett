import express from 'express';
import session from 'express-session';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';
//get express as exp, and set port number
const exp = express();
const port = 3000;
//what database i use, exampel database.db
const dbPromise = open({
    filename: 'database.db',
    driver: sqlite3.Database
});

//open a session so all trafick go trhough here
exp.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized:true
}));

//use embedded javascipt 'ejs'
exp.use(express.static('public'));
exp.set('view engine', 'ejs');
exp.use(express.urlencoded({ extended: true }));


exp.get("/register", async (req, res) => {
    res.render("register");
})
exp.listen(port, () => {
    console.log(`Server er startet her: http://localhost:${port}`);
});

exp.get('/', (req, res) => {
    res.render('login');
})
exp.post("/register", async (req, res) => {
    const db = await dbPromise;

    const { fname, lname, email, prf, password, passwordRepeat } = req.body;

    if (password != passwordRepeat) {
        res.render("register", { error: "Password must match." })
        return;
    }
    const passwordHash = await bcrypt.hash(password, 10);

    await db.run("INSERT INTO users (firstname, lastname, prfpic, email, password) VALUES (?, ?, ?, ?, ?)", fname, lname, prf, email, passwordHash);
    res.redirect("/");

})
//
exp.post('/auth', async function (req, res) {

    const db = await dbPromise;

    const { email, password } = req.body;
    let getUserDetails = `SELECT * FROM users WHERE email = '${email}'`;
    let checkInDb = await db.get(getUserDetails);
    if (checkInDb === undefined) {
        res.status(400);
        res.send("Invalid user" + getUserDetails);
    } else {
        const isPasswordMatched = await bcrypt.compare(
            password,
            checkInDb.password
        );

        if (isPasswordMatched) {
            res.status(200);
            
            if (checkInDb.admin == 1){
                req.session.admin = true;
            }
            // If the account exists
            // Authenticate the user
            req.session.loggedin = true;
            req.session.email = email;
            req.session.userId = checkInDb.ID;
            // Redirect to home page
            res.redirect('/home');
        } else {
            res.status(400);
            res.send("Invalid password");
            res.redirect("/");
        }
    }

});

exp.get('/home', function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        // Output username
        const user = req.session.email;  
        const admin = req.session.admin//admin sys
        res.render('home', {user, admin}); //admin sys
    } else {
        // Not logged in
        res.send('Please login to view this page!');
    }
});
exp.get('/admin', async function(req,res){
    if (req.session.loggedin){
        const user = req.session.email;
        const db = await dbPromise;
        let getUserDetails = `SELECT * FROM users WHERE email = '${user}' AND admin = 1`;
        let checkInDb = await db.get(getUserDetails);
        const query = 'SELECT * FROM users';
        const users = await db.all(query);
        
        if (checkInDb === undefined) {
            res.status(400);
            res.send("Invalid user");
        } else {
            let admin = true;
            res.status(200);
            res.render('admin', {user, admin, users});
        }
    }
})
exp.post('/products', async (req, res) => {
    const { category } = req.body;
    const db = await dbPromise;

    const query = 'SELECT * FROM products WHERE category = ?';
    const products = await db.all(query, [category]);

    res.render('products', { products });

});

exp.get("/logout", async (req, res) => {
   
    req.session.loggedin = false;
    req.session.username = '';
    req.session.admin = false //admin sys
    res.redirect("/")
})