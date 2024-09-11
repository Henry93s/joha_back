const { User, Class } = require("../models");
const newDate = require("../utils/newDate");
const crypto = require("crypto");
const imageToAWS = require("../utils/imageToAWS");
const deleteImageFromAWS = require("../utils/deleteImageFromAWS");

class ClassService {
  // create

  // all class select

  // one class select
  async findOneClass(nanoid) {
    const oneClass = Class.findOne(
      { nanoid },
      "nanoid author main_image sub_images title main_available_time sub_available_time main_location sub_location duration_time price contents introduce is_premium like star comments create_at update_at"
    );

    return { data: oneClass, code: 200, message: "클래스 조회 완료" };
  }
  // update

  // delete
  async deleteClass(nanoid) {
    const oneClass = await Class.findOne({ nanoid });
    if (!oneClass) {
      const error = new Error();
      Object.assign(error, {
        code: 404,
        message: "아이디로 조회된 클래스가 없습니다.",
      });
      throw error;
    } else {
      await Class.deleteOne(oneClass);
      return { code: 200, message: `${nanoid} 클래스 삭제 동작 완료` };
    }
  }
}

const classService = new ClassService();
module.exports = classService;
