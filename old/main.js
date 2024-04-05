import express from 'express';

const app = express();

const messages = [
    "hello",
    "hello messages 2"
]
for(i = 0; i < messages.length; i++){
    let containLists = document.createElement('div')
    containLists.innerHTML = '<li>${messages}</li>'

}
app.get('/', (req, res) => {
    res.send('hello world. The current time is ' + time);
});

app.listen(8000, () => {
    console.log('listen on amongus http://localhost:8000')
})

let time = messages.join(',');