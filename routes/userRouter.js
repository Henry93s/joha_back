const {Router} = require('express');
const asyncHandler = require('../middlewares/async-handler');
const userService = require('../services/userService');
// 현재 사용자가 로그인했는지 체크하는 미들웨어 적용
const reqUserCheck = require('../middlewares/reqUserCheck');
// 현재 사용자가 관리자인지 체크하는 미들웨어 추가
const reqUserAdminCheck = require('../middlewares/reqUserAdminCheck');
const emailCheck = require('../middlewares/emailCheck');
const passport = require('passport');
const jwtMiddleware = require('../middlewares/jwtMiddleware');
// multer 이미지 업로드 설정 가져오기
const upload = require('../utils/multerConfig');

const router = Router();

/* create (완료) */ 
router.post('/', upload.array('photo'), asyncHandler(async (req, res) => {
    const bodyData = req.body;
    const imageFiles = (!req.files || req.files.length === 0) ? ["notFound"] : req.files;
    const result = await userService.createUser(bodyData, imageFiles);
    return res.status(201).json(result);
}));

// update (수정)
router.put('/', upload.array('photo'), asyncHandler(async (req, res) => {
    const bodyData = req.body;
    const {email} = bodyData;
    const imageFiles = (!req.files || req.files.length === 0) ? ["notFound"] : req.files;
    const result = await userService.updateUser({email}, bodyData, imageFiles);
    return res.status(200).json(result);
}));

// delete (삭제)
router.delete('/', asyncHandler(async (req, res) => {
    const {email} = req.body;
    const result = await userService.deleteUser({email});
    return res.status(200).json(result);
}));

// JWT LOGOUT : 쿠키에 있는 토큰을 비우고, 만료 기간 0 으로 설정
// post 요청으로 url 직접 접근 차단 (완료)
router.post('/logout', asyncHandler(async (req, res) => {
    res.cookie('token', null, {
        //secure: false,
        maxAge: 0,
        /*
        sameSite: 'None', // 쿠키를 크로스 도메인 요청에 포함시키기 위해 'None'으로 설정
        path: '/' // 쿠키의 경로 설정
        */
    });
    return res.status(200).json({code: 200, message: "정상적으로 로그아웃되었습니다."});
}));

module.exports = router;