const {User, Verify, Post, Reserve} = require('../models');
const code = require('../utils/data/code');
const generateRandomValue = require('../utils/generate-random-value');
const sendEmail = require('../utils/nodemailer');
const newDate = require('../utils/newDate');
// sha256 단방향 해시 비밀번호 사용
const crypto = require('crypto');
// aes128(front) 비밀번호 복호화
const decryptPassword = require('../utils/decryptPassword');

class UserService {
    /* create 완료 */
    async createUser(bodyData){  
        // 추후 회원가입 시 인증 과정 추가 예정

        // 전화번호 중복 확인
        const {phone} = bodyData;
        const phoneUser = await User.findOne({phone});
        if(phoneUser){
            const error = new Error();
            Object.assign(error, {code: 400, message: "중복된 전화번호입니다. 전화번호를 변경해주세요."});
            throw error;
        };

        /* front 로그인 개발 시 주석 해제
        // password 를 백엔드에 보내 줄 때 aes-128 양방향 암호화 적용할 것
        // 백엔드에서는 aes-128 을 복호화하고 sha-256 해시화하여 db sha-256 해시 값과 비교시킨다.
        const key = process.env.AES_KEY;
        const decryptedPassword = decryptPassword(bodyData.password, key);
        */

        // s3 이미지 처리 구현 예정
        // photo = s3.url(`~~');


        // sha256 단방향 해시 비밀번호 사용
        const hash = crypto.createHash('sha256').update(bodyData.password/*decryptedPassword*/).digest('hex');
        const newUser = await User.create({
            email: bodyData.email,
            name: bodyData.name,
            phone: bodyData.phone,
            password: hash,
            photo: bodyData.photo ? bodyData.photo : "",
            base_address: bodyData.base_address,
            detail_address: bodyData.detail_address,
            is_admin: false
        });
        return {code: 200, message: `${bodyData.email} 계정으로 회원가입이 성공하였습니다.`};
    }

    

    
}

const userService = new UserService();
module.exports = userService;