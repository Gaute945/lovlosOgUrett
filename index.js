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
//authentication page if login info is correct login and save some info about table
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
            req.session.firstname = checkInDb.firstname; // Set firstname
            req.session.lastname = checkInDb.lastname; // Set lastname
            req.session.prfpic = checkInDb.prfpic; // Set prfpic
            req.session.comment = checkInDb.comment
            // Redirect to home page
            res.redirect('/home');
        } else {
            res.status(400);
            res.send("Invalid password");
            res.redirect("/");
        }
    }

});
//
exp.get('/home', async function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        // Output username
        const firstname = req.session.firstname
        const user = req.session.email;  
        const prfpic = req.session.prfpic;
        const admin = req.session.admin;
        const db = await dbPromise;
        try {
            const comments = await db.all('SELECT post.comment, post.email, post.firstname, users.prfpic FROM post INNER JOIN users ON post.email = users.email');
            res.render('home', { user, admin, comments, prfpic, firstname});
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.send('Please login to view this page!');
    }
});

exp.post('/home/post', async (req, res) => {
    if (req.session.loggedin) {
        const email = req.session.email;
        const firstname = req.session.firstname;
        const { comment } = req.body; //require or get the content of the message form body input field */
        const db = await dbPromise;
        try {
            await db.run('INSERT INTO post (comment, email, firstname) VALUES (?, ?, ?)', comment, email, firstname);
            console.log('user: '+ firstname +' commented: ' + comment)
            res.redirect('/home'); //if success redirect back to home
        } catch (error) {
            console.error('Post failed:');
            res.status(500).send('Error posting:');
        }
    } else {
        res.redirect('/'); 
    }
});
//delete comments
exp.post('/home/delete', async (req, res) => {
    if (req.session.loggedin) {
        const { email, comment } = req.body;
        const db = await dbPromise;
        try {
            await db.run('DELETE FROM post WHERE email = ? AND comment = ?', email, comment);
            console.log('Comment deleted');
            res.redirect('/home');
        } catch (error) {
            console.error('Deletion failed:', error);
            res.status(500).send('Error deleting comment');
        }
    } else {
        res.redirect('/');
    }
});
/* 
exp.post('/home/delete', async (req, res) => {
    if (req.session.loggedin) {
        const { email, comment } = req.body;
        const db = await dbPromise;
        try {
            await db.run('DELETE FROM post WHERE email = ? AND comment = ?', email, comment);
            console.log('Comment deleted');
            res.redirect('/home');
        } catch (error) {
            console.error('Deletion failed:', error);
            res.status(500).send('Error deleting comment');
        }
    } else {
        res.redirect('/');
    }
});
 */
//profile page
exp.get('/profile', async function(req,res){
    if (req.session.loggedin) {
        const user = req.session.email;  
        const fn = req.session.firstname;
        const ln = req.session.lastname;
        const pfpic = req.session.prfpic;
        const admin = req.session.admin//admin sys
        res.render('profile', {fn, ln, user, pfpic, admin}); //admin sys
    } else {
       res.send('Please login to view page silly');
    }
})
//for admin page see all users
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
//delete users
exp.post('/admin/delete', async (req, res) => {
    const { email } = req.body;
    const db = await dbPromise;

    try {
        await db.run('DELETE FROM users WHERE email = ?', email);
        res.redirect('/admin');
        console.log('user' + email + 'deleted')
    } catch (error) {
        console.error('Deletion failed: '+ email);
        res.status(500).send('Error deleting user');
    }
});
//chage to edit page
exp.get('/admin/edit', async (req, res) => {
    if (req.session.loggedin) {
        const email = req.query.email;
        const db = await dbPromise;
        const query = 'SELECT * FROM users WHERE email = ?';
        const user = await db.get(query, [email]);
        
        if (user) {
            res.render('edit', { user });
        } else {
            res.status(404).send('User not found');
        }
    } else {
        res.redirect('/');
    }
});
//change and update info
exp.post('/admin/update', async (req, res) => {
    const { email, firstname, lastname, prfpic } = req.body;
    const db = await dbPromise;
    
    try {
        await db.run('UPDATE users SET firstname = ?, lastname = ?, prfpic = ? WHERE email = ?', [firstname, lastname, prfpic, email]);
        console.log('user data updated firstname: ' + firstname + ' lastname: ' + lastname + ' email: ' +email)
        res.redirect('/admin');
    } catch (error) {
        console.error('Update failed:');
        res.status(500).send('Error updating user');
    }
});
// logout redirect to login page
exp.get("/logout", async (req, res) => {
   
    req.session.loggedin = false;
    req.session.username = '';
    req.session.admin = false //admin sys
    res.redirect("/")
});
