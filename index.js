import express from 'express';
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

const dbPromise = open({
    filename: 'database.db',
    driver: sqlite3.Database
});

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

app.get('/', (req, res) => {

    res.render('index');

});

app.post('/products', async (req, res) => {

    const { catagory } = req.body;
    const db = await dbPromise;
    const query = 'SELECT * FROM products WHERE catagory = ?';
    const products = await db.all(query, [catagory]);
    res.render('products', { products });

});