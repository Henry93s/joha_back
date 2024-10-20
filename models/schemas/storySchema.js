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


const storySchema = new Schema({
    // 스토리 primary key
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        require: true,
        index: true
    },
    // 작성자
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 스토리 메인 이미지 (필수)
    main_image : {
        type: String,
        required: true
    },
    // 스토리 보조 이미지
    sub_images: {
        type: [String]
    },
    // 스토리 이름
    title: {
        type: String,
        required: true,
        index: true
    },
    // 스토리 내용
    contents: {
        type: String,
        required: true
    },
    // 하트 개수
    like: {
        type: Number,
        required: true,
        default: 0
    },
    // 스토리 댓글(추가 스키마 연결)
    //comments: [CommentSchema], 
    // 스토리 생성일
    create_at: {
        type: String,
        default: () => { return newDate() }
    },
    // 스토리 수정일 
    update_at: {
        type: String,
        default: () => { return newDate() }
    }
},{
    timestamps: true
})

module.exports = storySchema;