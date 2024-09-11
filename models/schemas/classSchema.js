const {Schema} = require('mongoose');
// 중복 없는 문자열을 생성해주는 nanoid
const {nanoid} = require('nanoid');
// 추가 또는 수정될 때마다 날짜 데이터를 만들어주는 newDate()
const newDate = require('../../utils/newDate');

// sub-schema 작성 (댓글 테이블)
const CommentSchema = new Schema({
    // 댓글 primary key
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        require: true,
        index: true
    },
    // 댓글 작성자
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // 댓글 내용
    contents: {
        type: String,
        required: true
    },
    // 댓글 생성일
    create_at: {
        type: String,
        default: () => { return newDate() }
    },
    // 댓글 수정일 
    update_at: {
        type: String,
        default: () => { return newDate() }
    }
}, {
    timestamps: true
});


const classSchema = new Schema({
    // 레슨 primary key
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        require: true,
        index: true
    },
    // 클래스 강사(작성자)
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 클래스 메인 이미지 
    main_image : {
        type: String,
        required: true
    },
    // 클래스 보조 이미지
    sub_images: {
        type: [String]
    },
    // 클래스 이름
    title: {
        type: String,
        required: true,
        index: true
    },
    // 레슨 가능 일정 (일회성 / 주기성 / 모두)
    main_available_time: {
        type: String,
        required: true,
        index: true
    },
    // 레슨 가능 일정 (요일 및 시간)
    sub_available_time: {
        type: [String],
        required: true,
        index: true
    },
    // 메인 주소(다음 api)
    main_location: {
        type: String,
        required: true,
        index: true
    },
    // 상세 주소
    sub_location: {
        type: String,
        requited: true
    },
    // 1회 진행 시간 (시간 단위)
    duration_time: {
        type: Number,
        required: true,
        index: true
    },
    // 1회 가격
    price: {
        type: Number,
        required: true,
        index: true
    },
    // 레슨 내용
    contents: {
        type: String,
        required: true
    },
    // 강사 소개
    introduce: {
        type: String,
        required: true
    },
    // 옵션 프리미엄 여부
    is_premium:{
        type: Boolean,
        required: true,
        default: false
    },
    // 찜 하트 개수
    like: {
        type: Number,
        required: true,
        default: 0
    },
    // 별점
    star: {
        type: Number,
        required: true,
        default: 0
    },
    // 레슨 댓글(추가 스키마 연결)
    comments: [CommentSchema], 
    // 레슨 생성일
    create_at: {
        type: String,
        default: () => { return newDate() }
    },
    // 레슨 수정일 
    update_at: {
        type: String,
        default: () => { return newDate() }
    }
},{
    timestamps: true
})

module.exports = classSchema;