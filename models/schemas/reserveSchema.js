const {Schema} = require('mongoose');
const {nanoid} = require('nanoid');
// 추가 또는 수정될 때마다 날짜 데이터를 만들어주는 newDate()
const newDate = require('../../utils/newDate');

const reserveSchema = new Schema({
    // primary key (삭제시 만)
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        required: true,
        index: true
    },
    // (search -> in ) 예약자 정보 (나의수업 탭에서의 KEY)
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // class_nanoid => reserve 와 post search 겹치는 날짜를 조회 후 search data 에서 필터링할 때 사용한다.
    class_nanoid: {
        type: String,
        required: true
    },
    // 타이틀
    title: {
        type: String,
        required: true
    },
    // 강사 이메일 (강사 계정으로 수강 관리 페이지에서의 KEY)
    host_email: {
        type: String,
        required: true,
        index: true
    },
    // 강사 이름
    host_name: {
        type: String,
        required: true
    },
    // 강사 연락처
    host_phone: {
        type: String,
        required: true
    },
    // 메인 이미지
    main_image: {
        type: String, // URL 저장
        required: true
    },
    // 서브 이미지
    sub_images: [{
        type: String
    }],
    // 주요 위치
    main_location: {
        type: String,
        required: true
    },
    // 상세 주소
    sub_location: {
        type: String,
        required: true
    },
    // class 의 가격 총 금액
    amount: {
        type: Number,
        required: true
    },
    // (search -> in ) 강사 시작 시간
    start_time: {
        type: String,
        required: true,
        index: true
    },
    // (search -> in ) 강사 끝 시간
    end_time: {
        type: String,
        required: true,
        index: true
    },
    // 예약 생성일
    create_at: {
        type: String,
        default: () => { return newDate() }
    },
    // 예약 업데이트일
    update_at: {
        type: String,
        default: () => { return newDate() }
    },
},{
    timestamps: true
});

module.exports = reserveSchema;