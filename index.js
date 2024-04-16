import express from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPromise = open({
    filename: 'database.db',
    driver: sqlite3.Database
});

const app = express();
const port = 3000;

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.static('public'));
app.set('view engine', 'ejs');
/* app.use(express.urlencoded({ extended: false })); */
app.use(express.urlencoded({ extended: true }));


//routes
app.listen(port, () => {
    console.log(`lokalhost:${port}`);
});

app.get('/', (req, res) => {

    res.render('index');

});

app.post('/products', async (req, res) => {

    const { category } = req.body;
    const db = await dbPromise;
    const query = 'SELECT * FROM products WHERE category = ?';
    const products = await db.all(query, [category]);
    res.render('products', { products });
});