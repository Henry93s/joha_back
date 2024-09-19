const {Schema} = require('mongoose');
const verifySchema = new Schema({
    // 인증 번호 발급 코드(비밀번호 찾기, 회원가입 에서 요청한건지 구분하기 위함)
    code: {
        type: String,
        required: true
    },
    // 인증 요청 이메일
    data: {
        type: String,
        required: true
    },
    // 인증 되었는지 여부 판단(true 일 경우 데이터 삭제)
    is_verified: {
        type: Boolean,
        default: false
    },
    // 인증 코드
    secret: {
        type: String,
        required: true
    }
},{
    timestamps: true
});

module.exports = verifySchema;
