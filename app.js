const express = require('express');
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
// login strategy
const local = require('./strategy/loginStrategy');
const jwtlocal = require('./strategy/jwtStrategy');
const jwtMiddleware = require('./middlewares/jwtMiddleware');
// server router
const userRouter = require('./routes/userRouter');
const classRouter = require('./routes/classRouter');
const loginRouter = require('./routes/loginRouter');
// multer 설정 가져오기
const upload = require('./utils/multerConfig');

const app = express();

// dotenv
dotenv.config();

// 모든 도메인에서 cors 허용 (개발 및 테스트)
app.use(cors());


// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// passport initialize
app.use(passport.initialize());
passport.use(local);
passport.use(jwtlocal);
app.use(jwtMiddleware);

// mongoose connect
mongoose.connect(process.env.MONGO_URI,{
    dbName: process.env.MONGO_DBNAME
})
.then( res => console.log(`mongoDB ${process.env.MONGO_DBNAME} collection connected`))
.catch( err => console.log(err));
mongoose.connection.on('err', (err) => {
    console.log("mongoDB err");
});

// user, login, ... router
app.use('/users', userRouter);
app.use('/class', classRouter);
app.use('/login', loginRouter);

// 정적 파일 (default html)
app.use(express.static('public'));

// app.get (front routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

// 예외 error 핸들러
app.use((err, req, res, next) => {
    if(err.code === 401){
        console.log(err.code + " Unauthorized error 발생 : " + err.message);
        return res.status(401).json(err);
    } else if(err.code === 404){
        console.log(err.code + " Not Found error 발생 : " + err.message);
        return res.status(404).json(err);
    } else {
        console.log("400 Bad Request error 발생 : " + err.message);
        return res.status(400).json(err);
    }
});

app.listen(process.env.PORT, () => {
    console.log(`${process.env.PORT} server port connected`);
});