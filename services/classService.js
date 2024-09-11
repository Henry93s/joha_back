const { User, Class } = require("../models");
const newDate = require("../utils/newDate");
const crypto = require("crypto");
const imageToAWS = require("../utils/imageToAWS");
const deleteImageFromAWS = require("../utils/deleteImageFromAWS");

class ClassService {
    // create

    // all class select
    async findAllClass() {
        const classes = await Class.find();
        if (!classes.length) {
            const error = new Error("조회된 클래스가 없습니다.");
            Object.assign(error, { code: 404 });
            throw error;
        }
        return { code: 200, data: classes, message: "전체 클래스 조회 완료" };
    }

    // find class by title
    async findClassByTitle(title) {
        if (!title) {
            const error = new Error("제목이 필요합니다.");
            Object.assign(error, { code: 400 });
            throw error;
        }
        const titleClass = await Class.find({ title });
        if (!titleClass.length) {
            const error = new Error("해당 제목으로 조회된 레슨이 없습니다.");
            Object.assign(error, { code: 404 });
            throw error;
        }
        return { code: 200, data: titleClass, message: "타이틀로 조회 완료" };
    }

    // one class select

    // update

    // delete
}

const classService = new ClassService();
module.exports = classService;
